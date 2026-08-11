import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crown, User } from "lucide-react";

// Défilement des comptes reconnus : chaque compte apparaît au centre, puis glisse vers une
// pile sur le côté pendant que le suivant prend sa place ; une fois tous passés, la pile
// entière converge et « fusionne » en un point avant de céder la place à l'écran "ready".
const ACCOUNT_HOLD = 650; // ms passés au centre avant de rejoindre la pile
const DOCK_SETTLE = 350; // ms de pause une fois tous les comptes alignés sur le côté
const FUSE_DURATION = 650; // ms de l'animation de fusion
const DOCK_SIDE_X = 96; // px, décalage horizontal de la pile
const DOCK_STEP_Y = 32; // px, espacement vertical entre comptes empilés

const BootIntro = ({ connectedAccounts = [], worldName = "Addunya", onFinished }) => {
  const accounts = useMemo(() => connectedAccounts.slice(0, 6), [connectedAccounts]);

  const stages = useMemo(() => {
    const s = [
      { type: "welcome", duration: 1600 },
      { type: "loading", duration: 1600 },
    ];
    if (accounts.length > 0) {
      s.push({
        type: "accounts",
        accounts,
        duration: accounts.length * ACCOUNT_HOLD + DOCK_SETTLE + FUSE_DURATION,
      });
    }
    s.push({ type: "ready", duration: null }); // dernière étape : attend le clic (ou une touche)
    return s;
  }, [accounts]);

  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState("playing"); // playing | flash | fading
  const [activeAccountIdx, setActiveAccountIdx] = useState(0);
  const [fusingAccounts, setFusingAccounts] = useState(false);
  const finishedRef = useRef(false);

  // stages/onFinished sont recréés à chaque re-render du parent (sync Firestore en continu) —
  // on les lit depuis des refs pour que ça n'interfère jamais avec les minuteurs ci-dessous
  // (même bug que sur LinkStartIntro : une dépendance instable réinitialiserait le minuteur en boucle).
  const stagesRef = useRef(stages);
  useEffect(() => { stagesRef.current = stages; }, [stages]);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  // Pilote le défilé des comptes reconnus à l'entrée de l'étape "accounts" : chaque compte
  // devient actif à son tour, puis une fois tous passés ils sont figés côte à côte sur le
  // côté (DOCK_SETTLE) avant de déclencher la fusion finale.
  useEffect(() => {
    const currentStage = stagesRef.current[stageIndex];
    if (!currentStage || currentStage.type !== "accounts") return;
    const accs = currentStage.accounts;
    setActiveAccountIdx(0);
    setFusingAccounts(false);
    const timers = accs.slice(1).map((_, idx) => {
      const i = idx + 1;
      return setTimeout(() => setActiveAccountIdx(i), i * ACCOUNT_HOLD);
    });
    timers.push(setTimeout(() => setActiveAccountIdx(accs.length), accs.length * ACCOUNT_HOLD));
    timers.push(setTimeout(() => setFusingAccounts(true), accs.length * ACCOUNT_HOLD + DOCK_SETTLE));
    return () => timers.forEach(clearTimeout);
  }, [stageIndex]);

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

        {stage.type === "accounts" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
              Personnages reconnus sur cet appareil
            </p>
            <div className="relative w-full flex items-center justify-center" style={{ height: 200 }}>
              {fusingAccounts && (
                <div className="absolute w-20 h-20 rounded-full bg-yellow-400/30 blur-2xl animate-[bootFuseGlow_0.65s_ease-out_forwards]" />
              )}
              {stage.accounts.map((acc, i) => {
                if (i > activeAccountIdx) return null; // pas encore présenté
                const isActive = i === activeAccountIdx && !fusingAccounts;
                const dockY = (i - (stage.accounts.length - 1) / 2) * DOCK_STEP_Y;
                let transform = `translate(${DOCK_SIDE_X}px, ${dockY}px) scale(0.55)`;
                let opacity = 0.9;
                if (isActive) { transform = "translate(0px, 0px) scale(1)"; opacity = 1; }
                if (fusingAccounts) { transform = "translate(0px, 0px) scale(0)"; opacity = 0; }
                const avatarSize = isActive ? 56 : 34;
                return (
                  <div
                    key={acc.id}
                    className="absolute flex flex-col items-center gap-1.5 animate-[bootFadeIn_0.4s_ease-out] transition-all ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ transform, opacity, transitionDuration: fusingAccounts ? "650ms" : "450ms" }}
                  >
                    {acc.avatarUrl ? (
                      <img
                        src={acc.avatarUrl}
                        alt=""
                        className="rounded-full object-cover border-2 border-yellow-600/50 transition-[width,height] duration-[450ms]"
                        style={{ width: avatarSize, height: avatarSize, minWidth: avatarSize, minHeight: avatarSize, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-full bg-stone-800 border-2 border-yellow-600/50 flex items-center justify-center transition-[width,height] duration-[450ms]"
                        style={{ width: avatarSize, height: avatarSize, minWidth: avatarSize, minHeight: avatarSize }}
                      >
                        <User size={isActive ? 22 : 14} className="text-stone-500" />
                      </div>
                    )}
                    {isActive && (
                      <p className="text-lg font-black uppercase tracking-wide text-stone-100 whitespace-nowrap animate-[bootFadeIn_0.3s_ease-out]">
                        {acc.name || acc.id}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
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
        @keyframes bootFuseGlow {
          0% { opacity: 0; transform: scale(0.3); }
          40% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
};

export default BootIntro;
