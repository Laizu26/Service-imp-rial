import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crown, User } from "lucide-react";

// Défilement des comptes reconnus : les premiers (INTRO_ACCOUNTS_MAX) défilent un par un au
// centre, puis tous les comptes connectés (même au-delà de ce nombre) se rangent en cercle ;
// une fois le cercle formé, ils convergent et « fusionnent » en un éclat de confettis avant de
// céder la place à l'écran "ready".
const INTRO_ACCOUNTS_MAX = 6; // nombre de comptes présentés individuellement au centre
const ACCOUNT_HOLD = 520; // ms passés au centre avant de rejoindre le cercle
const DOCK_SETTLE = 400; // ms de pause une fois tous les comptes alignés en cercle
const FUSE_DURATION = 750; // ms de l'animation de fusion (confettis inclus)
const DOCK_RADIUS_BASE = 68; // px, rayon du cercle pour peu de comptes
const DOCK_RADIUS_STEP = 4; // px, rayon additionnel par compte au-delà de 6
const DOCK_RADIUS_MAX = 130; // px, rayon maximum du cercle
const CONFETTI_COLORS = ["#eab308", "#f59e0b", "#fde68a", "#fbbf24", "#fff7ed", "#d97706"];

const circleSlot = (i, total) => {
  const radius = Math.min(DOCK_RADIUS_MAX, DOCK_RADIUS_BASE + Math.max(0, total - 6) * DOCK_RADIUS_STEP);
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

const BootIntro = ({ connectedAccounts = [], worldName = "Addunya", onFinished }) => {
  const introAccounts = useMemo(() => connectedAccounts.slice(0, INTRO_ACCOUNTS_MAX), [connectedAccounts]);

  const stages = useMemo(() => {
    const s = [
      { type: "welcome", duration: 1600 },
      { type: "loading", duration: 1600 },
    ];
    if (connectedAccounts.length > 0) {
      s.push({
        type: "accounts",
        introAccounts,
        allAccounts: connectedAccounts,
        duration: introAccounts.length * ACCOUNT_HOLD + DOCK_SETTLE + FUSE_DURATION,
      });
    }
    s.push({ type: "ready", duration: null }); // dernière étape : attend le clic (ou une touche)
    return s;
  }, [connectedAccounts, introAccounts]);

  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState("playing"); // playing | flash | fading
  const [activeAccountIdx, setActiveAccountIdx] = useState(0);
  const [accountsSettled, setAccountsSettled] = useState(false);
  const [fusingAccounts, setFusingAccounts] = useState(false);
  const finishedRef = useRef(false);

  // Confettis générés une seule fois par montage : la fusion ne joue qu'une fois par écran.
  const confettiPieces = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 100;
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 15,
      rot: (Math.random() - 0.5) * 720,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 90,
      w: 3 + Math.random() * 3,
      h: 6 + Math.random() * 5,
    };
  }), []);

  // stages/onFinished sont recréés à chaque re-render du parent (sync Firestore en continu) —
  // on les lit depuis des refs pour que ça n'interfère jamais avec les minuteurs ci-dessous
  // (même bug que sur LinkStartIntro : une dépendance instable réinitialiserait le minuteur en boucle).
  const stagesRef = useRef(stages);
  useEffect(() => { stagesRef.current = stages; }, [stages]);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  // Pilote le défilé des comptes reconnus à l'entrée de l'étape "accounts" : chaque compte
  // présenté individuellement devient actif à son tour, puis une fois tous passés, le cercle se
  // forme avec l'ensemble des comptes connectés (accountsSettled) et se fige un instant
  // (DOCK_SETTLE) avant de déclencher la fusion finale.
  useEffect(() => {
    const currentStage = stagesRef.current[stageIndex];
    if (!currentStage || currentStage.type !== "accounts") return;
    const intro = currentStage.introAccounts;
    setActiveAccountIdx(0);
    setAccountsSettled(false);
    setFusingAccounts(false);
    const timers = intro.slice(1).map((_, idx) => {
      const i = idx + 1;
      return setTimeout(() => setActiveAccountIdx(i), i * ACCOUNT_HOLD);
    });
    timers.push(setTimeout(() => {
      setActiveAccountIdx(intro.length);
      setAccountsSettled(true);
    }, intro.length * ACCOUNT_HOLD));
    timers.push(setTimeout(() => setFusingAccounts(true), intro.length * ACCOUNT_HOLD + DOCK_SETTLE));
    return () => timers.forEach(clearTimeout);
  }, [stageIndex]);

  // Si on saute pendant le défilé des comptes, on ne saute pas la fusion elle-même : on la
  // déclenche immédiatement (avec tous les comptes connectés) plutôt que de la couper court,
  // sinon un utilisateur impatient qui passe vite ne voit jamais ses autres comptes rejoindre
  // le cercle. Un second appui pendant la fusion, lui, saute directement à la fin.
  const dismiss = () => {
    if (finishedRef.current) return;
    const currentStage = stagesRef.current[stageIndex];
    if (currentStage?.type === "accounts" && !fusingAccounts) {
      // On règle d'abord le cercle (accountsSettled) SANS fusionner dans le même rendu :
      // les comptes au-delà de l'intro ne sont montés qu'à ce moment-là, il leur faut un
      // rendu "posés dans le cercle" avant de passer à l'état fusionné, sinon ils apparaissent
      // et disparaissent d'un coup sans jamais être visibles dans la fusion.
      setActiveAccountIdx(currentStage.introAccounts.length);
      setAccountsSettled(true);
      const FAST_FORWARD_SETTLE = 200;
      setTimeout(() => setFusingAccounts(true), FAST_FORWARD_SETTLE);
      setTimeout(
        () => setStageIndex((i) => Math.min(i + 1, stagesRef.current.length - 1)),
        FAST_FORWARD_SETTLE + FUSE_DURATION
      );
      return;
    }
    finishedRef.current = true;
    setPhase("flash");
  };

  // dismiss() dépend de stageIndex/fusingAccounts (état frais) — on la lit via une ref pour que
  // le listener clavier ci-dessous (monté une seule fois) appelle toujours la version à jour
  // plutôt qu'une fermeture figée sur l'état du tout premier rendu.
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; });

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
    const handler = () => dismissRef.current();
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
            <div className="relative w-full flex items-center justify-center" style={{ height: 220 }}>
              {fusingAccounts && (
                <>
                  <div className="absolute w-20 h-20 rounded-full bg-yellow-400/30 blur-2xl animate-[bootFuseGlow_0.7s_ease-out_forwards]" />
                  {confettiPieces.map((p) => (
                    <div
                      key={p.id}
                      className="absolute rounded-sm"
                      style={{
                        width: p.w,
                        height: p.h,
                        backgroundColor: p.color,
                        left: "50%",
                        top: "50%",
                        marginLeft: -p.w / 2,
                        marginTop: -p.h / 2,
                        "--dx": `${p.dx}px`,
                        "--dy": `${p.dy}px`,
                        "--rot": `${p.rot}deg`,
                        animation: "bootConfetti 850ms cubic-bezier(0.16,1,0.3,1) forwards",
                        animationDelay: `${p.delay}ms`,
                      }}
                    />
                  ))}
                </>
              )}
              {stage.allAccounts.map((acc, i) => {
                const isIntro = i < stage.introAccounts.length;
                if (isIntro) {
                  if (i > activeAccountIdx) return null; // pas encore présenté
                } else if (!accountsSettled && !fusingAccounts) {
                  return null; // au-delà des comptes présentés : n'apparaît qu'une fois le cercle formé
                }
                const isActive = isIntro && i === activeAccountIdx && !accountsSettled && !fusingAccounts;
                const { x, y } = circleSlot(i, stage.allAccounts.length);
                let transform = `translate(${x}px, ${y}px) scale(0.55)`;
                let opacity = 0.9;
                if (isActive) { transform = "translate(0px, 0px) scale(1)"; opacity = 1; }
                if (fusingAccounts) { transform = "translate(0px, 0px) scale(0)"; opacity = 0; }
                const avatarSize = isActive ? 56 : 34;
                return (
                  <div
                    key={acc.id}
                    className="absolute flex flex-col items-center gap-1.5 animate-[bootFadeIn_0.4s_ease-out] transition-all ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ transform, opacity, transitionDuration: fusingAccounts ? "700ms" : "450ms" }}
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
        @keyframes bootConfetti {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BootIntro;
