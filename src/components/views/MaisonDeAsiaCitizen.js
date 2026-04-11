import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Gem, Heart, LogOut, Star, Clock, Users, X, History,
  MessageCircle, Timer, User, ChevronRight, ChevronLeft, Images,
  Crown, Percent, ShieldOff, Wrench,
} from "lucide-react";
import { formatMoney } from "../../lib/gameUtils";
import {
  getMaisonVipRank,
  getMaisonLoyaltyDiscount,
  getMaisonSubscription,
  computeMaisonDiscount,
} from "../../hooks/useGameActions";

const MaisonDeAsiaCitizen = ({
  citizens,
  houseRegistry,
  staff = [],
  maisonQueue = [],
  maisonHistory = [],
  maisonReviews = [],
  maisonDefaultDuration = 60,
  maisonServiceCategories = [],
  maisonSubscriptions = [],
  maisonSubscriptionPrice = 50,
  onBook,
  onJoinQueue,
  onLeaveQueue,
  onSubmitReview,
  onBuySubscription,
  userBalance,
  user,
}) => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeSection, setActiveSection] = useState("catalog");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [servicePickerWorker, setServicePickerWorker] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [, setTick] = useState(0);
  const onBookRef = useRef(onBook);
  onBookRef.current = onBook;

  // Re-render toutes les 10s pour le timer
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const myBooking = houseRegistry.find((r) => r.citizenId === user?.id);
  const myWorker = myBooking ? staff.find((s) => s.id === myBooking.staffId) : null;
  const myQueueEntry = maisonQueue.find((q) => q.citizenId === user?.id);

  const getTimeRemaining = (booking, worker) => {
    if (!booking.startTime) return null;
    const dur = booking.duration || worker?.sessionDuration || maisonDefaultDuration;
    const end = booking.startTime + dur * 60000;
    const rem = end - Date.now();
    if (rem <= 0) return null;
    const mins = Math.floor(rem / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h${String(mins % 60).padStart(2, "0")}`;
    return `${mins} min`;
  };

  const isSessionExpired = myBooking && !getTimeRemaining(myBooking, myWorker);

  // Auto-fin de session quand le timer expire
  useEffect(() => {
    if (!isSessionExpired) return;
    const timeout = setTimeout(() => {
      onBookRef.current(null);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isSessionExpired]);

  const getProgress = (booking, worker) => {
    if (!booking.startTime) return 100;
    const dur = booking.duration || worker?.sessionDuration || maisonDefaultDuration;
    const elapsed = Date.now() - booking.startTime;
    return Math.min(100, (elapsed / (dur * 60000)) * 100);
  };

  const getStaffRating = (staffId) => {
    const revs = maisonReviews.filter((r) => r.staffId === staffId);
    if (revs.length === 0) return { avg: 0, count: 0 };
    const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
    return { avg: Math.round(avg * 10) / 10, count: revs.length };
  };

  const getQueueCount = (staffId) => maisonQueue.filter((q) => q.staffId === staffId).length;

  const myHistory = (maisonHistory || [])
    .filter((h) => h.citizenId === user?.id)
    .sort((a, b) => b.endTime - a.endTime);

  const pendingReviews = (maisonHistory || []).filter(
    (h) => h.citizenId === user?.id && !h.reviewed
  );

  const StarRating = ({ rating, size = 14, interactive, onChange }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => interactive && onChange && onChange(i)}
          className={`${interactive ? "cursor-pointer hover:scale-125" : "cursor-default"} transition-transform`}
        >
          <Star
            size={size}
            className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-stone-600"}
          />
        </button>
      ))}
    </div>
  );

  const handleBooking = (worker, serviceId = null) => {
    const svc = serviceId ? (worker.services || []).find((s) => s.id === serviceId) : null;
    const basePrice = svc ? (svc.price || 0) : (worker.price || 0);
    const discountPct = computeMaisonDiscount(user?.id, worker.id, maisonHistory, maisonSubscriptions);
    const finalPrice = Math.max(0, Math.round(basePrice * (1 - discountPct / 100)));
    if (userBalance < finalPrice) return;
    if (houseRegistry.find((r) => r.staffId === worker.id)) return;
    const svcLabel = svc ? ` — ${svc.name}` : "";
    const discountLabel = discountPct > 0 ? ` (remise ${discountPct}%)` : "";
    if (window.confirm(`Passer un moment avec ${worker.name}${svcLabel} pour ${formatMoney(finalPrice)}${discountLabel} ?`)) {
      onBook(worker.id, serviceId || null);
      setSelectedStaff(null);
      setServicePickerWorker(null);
      setSelectedServiceId(null);
    }
  };

  const handleOpenBooking = (worker, e) => {
    if (e) e.stopPropagation();
    if (worker.isAvailable === false) return;
    if ((worker.services || []).length > 0) {
      setServicePickerWorker(worker);
      setSelectedServiceId(null);
    } else {
      handleBooking(worker, null);
    }
  };

  const handleLeave = () => {
    if (window.confirm("Quitter la Maison de Asia ?")) onBook(null);
  };

  const handleSubmitReview = () => {
    if (!reviewTarget) return;
    onSubmitReview(reviewTarget, reviewRating, reviewComment);
    setReviewTarget(null);
    setReviewRating(5);
    setReviewComment("");
  };

  // === MODAL PROFIL (avec portal pour éviter le clipping) ===
  const ProfileModal = ({ worker, onClose }) => {
    const [galleryIdx, setGalleryIdx] = useState(0);

    if (!worker) return null;
    const rating = getStaffRating(worker.id);
    const isOccupied = houseRegistry.some((r) => r.staffId === worker.id);
    const queueCount = getQueueCount(worker.id);
    const inMyQueue = maisonQueue.some((q) => q.citizenId === user?.id && q.staffId === worker.id);
    const staffReviews = maisonReviews.filter((r) => r.staffId === worker.id).slice(0, 10);
    const dur = worker.sessionDuration || maisonDefaultDuration;

    // Construire la liste d'images : avatar + galerie
    const allImages = [];
    if (worker.avatarUrl) allImages.push(worker.avatarUrl);
    if (worker.gallery && worker.gallery.length > 0) {
      worker.gallery.forEach((img) => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    }
    const hasMultipleImages = allImages.length > 1;
    const currentImage = allImages[galleryIdx % allImages.length] || null;

    const modalContent = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          className="relative bg-stone-900 border border-fuchsia-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white z-20">
            <X size={20} />
          </button>

          {/* Image / Galerie */}
          <div className="h-80 overflow-hidden rounded-t-2xl relative">
            {currentImage ? (
              <img src={currentImage} alt="" className="w-full h-full object-cover transition-all duration-300" />
            ) : (
              <div className="w-full h-full bg-fuchsia-950 flex items-center justify-center">
                <User size={64} className="text-fuchsia-800" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />

            {/* Navigation galerie */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryIdx((galleryIdx - 1 + allImages.length) % allImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setGalleryIdx((galleryIdx + 1) % allImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                {/* Indicateurs */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setGalleryIdx(i); }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === galleryIdx % allImages.length
                          ? "bg-fuchsia-400 w-4"
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
                {/* Compteur */}
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-white/80 flex items-center gap-1 border border-white/10">
                  <Images size={10} /> {(galleryIdx % allImages.length) + 1}/{allImages.length}
                </div>
              </>
            )}
          </div>

          <div className="p-6 -mt-16 relative z-10">
            <h2 className="text-2xl font-black text-white mb-1">{worker.name}</h2>
            <p className="text-fuchsia-400 text-sm italic mb-2">{worker.specialty}</p>

            {worker.specialtyDescription && (
              <p className="text-stone-400 text-sm mb-4 leading-relaxed">
                {worker.specialtyDescription}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mb-4">
              <span className="bg-fuchsia-900/50 border border-fuchsia-700 text-fuchsia-200 px-3 py-1 rounded-full text-xs font-bold">
                {formatMoney(worker.price)}
              </span>
              <span className="bg-stone-800 border border-stone-600 text-stone-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Clock size={12} /> {dur} min
              </span>
              {rating.count > 0 && (
                <span className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" /> {rating.avg} ({rating.count})
                </span>
              )}
            </div>

            {/* Miniatures galerie */}
            {hasMultipleImages && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIdx(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      i === galleryIdx % allImages.length
                        ? "border-fuchsia-500 ring-1 ring-fuchsia-500/50"
                        : "border-stone-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Disponibilité + Action */}
            <div className="mb-6">
              {worker.isAvailable === false ? (
                <div className="w-full py-3 rounded-lg text-center text-[10px] uppercase font-black text-stone-500 bg-stone-800 border border-stone-700 flex items-center justify-center gap-2">
                  <ShieldOff size={14} /> Indisponible pour le moment
                </div>
              ) : !isOccupied ? (
                (() => {
                  const hasWorkerSvcs = (worker.services || []).length > 0;
                  const discPct = computeMaisonDiscount(user?.id, worker.id, maisonHistory, maisonSubscriptions);
                  const baseP = hasWorkerSvcs ? Math.min(...worker.services.map((s) => s.price || 0)) : worker.price;
                  const fp = Math.max(0, Math.round(baseP * (1 - discPct / 100)));
                  return (
                    <button
                      onClick={() => {
                        onClose();
                        if (hasWorkerSvcs) { setServicePickerWorker(worker); setSelectedServiceId(null); }
                        else handleBooking(worker, null);
                      }}
                      disabled={userBalance < fp || myBooking}
                      className={`w-full py-3 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                        myBooking
                          ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                          : userBalance < fp
                          ? "bg-stone-800 text-red-400 cursor-not-allowed border border-red-900/30"
                          : "bg-fuchsia-800 hover:bg-fuchsia-700 text-white border border-fuchsia-600"
                      }`}
                    >
                      <Heart size={14} fill="currentColor" />
                      {hasWorkerSvcs ? `Choisir un service (dès ${formatMoney(fp)})` : `Réserver — ${formatMoney(fp)}${discPct > 0 ? ` (-${discPct}%)` : ""}`}
                    </button>
                  );
                })()
              ) : inMyQueue ? (
                <button
                  onClick={() => { onLeaveQueue(worker.id); onClose(); }}
                  className="w-full py-3 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] bg-yellow-900/50 text-yellow-300 border border-yellow-700 hover:bg-yellow-800/50 transition-all"
                >
                  Quitter la file (position {maisonQueue.find((q) => q.citizenId === user?.id && q.staffId === worker.id)?.position || "?"})
                </button>
              ) : (
                <button
                  onClick={() => { if (onJoinQueue) onJoinQueue(worker.id); onClose(); }}
                  disabled={!!myBooking || !!myQueueEntry}
                  className={`w-full py-3 rounded-lg font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    myBooking || myQueueEntry
                      ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                      : "bg-red-900/50 text-red-200 border border-red-700 hover:bg-red-800/50"
                  }`}
                >
                  <Users size={14} /> Occupée — Rejoindre la file ({queueCount} en attente)
                </button>
              )}
            </div>

            {/* Avis */}
            {staffReviews.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest mb-3 flex items-center gap-2">
                  <MessageCircle size={14} /> Avis ({staffReviews.length})
                </h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {staffReviews.map((rev) => (
                    <div key={rev.id} className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-stone-300">{rev.citizenName}</span>
                        <StarRating rating={rev.rating} size={10} />
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-stone-400 italic">{rev.comment}</p>
                      )}
                      <div className="text-[9px] text-stone-600 mt-1 font-mono">
                        {new Date(rev.timestamp).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-stone-900 to-fuchsia-950 rounded-xl overflow-hidden border border-fuchsia-900 shadow-2xl font-serif text-fuchsia-50">
      {/* HEADER */}
      <div className="p-6 text-center relative shrink-0 border-b border-fuchsia-800/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
        <Gem size={32} className="mx-auto mb-1 text-fuchsia-500 animate-pulse" />
        <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-fuchsia-100">Le Harem</h1>
        <p className="text-[10px] font-sans uppercase tracking-widest mt-1 text-fuchsia-400">
          Maison de Asia • Plaisirs Nocturnes
        </p>
        {(() => {
          const vip = getMaisonVipRank(user?.id, maisonHistory);
          if (!vip) return null;
          return (
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border text-xs font-black ${vip.bg} ${vip.color}`}>
              <Crown size={11} /> {vip.emoji} {vip.label}
              {vip.next && (
                <span className="text-[9px] opacity-70 ml-1">
                  · {vip.next.at - vip.visits} visites → {vip.next.label}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-fuchsia-900 scrollbar-track-transparent">
        {/* === SESSION ACTIVE === */}
        {myBooking ? (
          <div className="max-w-md mx-auto bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-fuchsia-500/30 text-center shadow-[0_0_50px_rgba(192,38,211,0.2)]">
            <div
              className="w-28 h-28 mx-auto rounded-full p-1 border-2 border-fuchsia-500 mb-4 shadow-lg overflow-hidden cursor-pointer hover:border-fuchsia-300 transition-colors"
              onClick={() => myWorker && setSelectedStaff(myWorker)}
            >
              {myWorker?.avatarUrl ? (
                <img src={myWorker.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-fuchsia-950 flex items-center justify-center">
                  <User size={40} className="text-fuchsia-800" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{myWorker?.name || "Inconnu"}</h2>
            <p className="text-fuchsia-300 text-sm mb-4 italic">{myWorker?.specialty}</p>

            {/* Timer */}
            <div className="mb-6">
              {isSessionExpired ? (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 animate-pulse">
                  <Timer size={24} className="mx-auto mb-2 text-red-400" />
                  <div className="text-red-300 font-black uppercase tracking-widest text-sm">Séance Terminée</div>
                  <p className="text-red-400/70 text-xs mt-1">Départ automatique dans quelques instants...</p>
                </div>
              ) : (
                <div className="bg-fuchsia-900/20 border border-fuchsia-700/30 rounded-lg p-4">
                  <div className="text-fuchsia-300 text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                    <Clock size={12} /> Temps restant
                  </div>
                  <div className="text-3xl font-black text-white font-mono">
                    {getTimeRemaining(myBooking, myWorker) || "—"}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-300 rounded-full transition-all"
                      style={{ width: `${getProgress(myBooking, myWorker)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-500 mt-2 font-mono">
                    Début : {new Date(myBooking.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLeave}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold uppercase tracking-widest transition-all border border-stone-600 flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Prendre congé
            </button>
          </div>
        ) : (
          <>
            {/* === ONGLETS === */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveSection("catalog")}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeSection === "catalog"
                    ? "bg-fuchsia-800 text-white border border-fuchsia-600"
                    : "bg-stone-800/50 text-stone-400 border border-stone-700 hover:text-stone-200"
                }`}
              >
                Catalogue
              </button>
              <button
                onClick={() => setActiveSection("history")}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  activeSection === "history"
                    ? "bg-fuchsia-800 text-white border border-fuchsia-600"
                    : "bg-stone-800/50 text-stone-400 border border-stone-700 hover:text-stone-200"
                }`}
              >
                <History size={12} /> Mes Visites
                {pendingReviews.length > 0 && (
                  <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded-full text-[8px] font-black">
                    {pendingReviews.length}
                  </span>
                )}
              </button>
            </div>

            {/* Bannière avis en attente */}
            {activeSection === "catalog" && pendingReviews.length > 0 && (
              <div
                onClick={() => setActiveSection("history")}
                className="mb-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-center cursor-pointer hover:bg-yellow-900/30 transition-colors"
              >
                <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">
                  {pendingReviews.length} avis en attente — Cliquez pour noter
                </span>
              </div>
            )}

            {/* Carte abonnement */}
            {activeSection === "catalog" && (() => {
              const sub = getMaisonSubscription(user?.id, maisonSubscriptions);
              const isSubbed = !!sub;
              return (
                <div className={`mb-4 rounded-xl border p-4 flex items-center gap-4 ${isSubbed ? "bg-fuchsia-900/30 border-fuchsia-600/40" : "bg-stone-800/40 border-stone-600/30"}`}>
                  <Crown size={24} className={isSubbed ? "text-fuchsia-400 shrink-0" : "text-stone-500 shrink-0"} />
                  <div className="flex-1 min-w-0">
                    {isSubbed ? (
                      <>
                        <div className="text-xs font-black text-fuchsia-300 uppercase tracking-widest">Abonné VIP</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          -10% sur toutes les réservations · Expire le {new Date(sub.expiresAt).toLocaleDateString("fr-FR")}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-black text-stone-300 uppercase tracking-widest">Abonnement Mensuel</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {formatMoney(maisonSubscriptionPrice)} / 30 jours · -10% sur toutes les réservations
                        </div>
                      </>
                    )}
                  </div>
                  {!isSubbed && (
                    <button
                      onClick={() => onBuySubscription && onBuySubscription()}
                      disabled={userBalance < maisonSubscriptionPrice}
                      className="px-3 py-2 bg-fuchsia-800 text-white rounded-lg text-[9px] font-black uppercase hover:bg-fuchsia-700 disabled:opacity-50 shrink-0 flex items-center gap-1"
                    >
                      <Percent size={11} /> S'abonner
                    </button>
                  )}
                  {isSubbed && (
                    <button
                      onClick={() => onBuySubscription && onBuySubscription()}
                      disabled={userBalance < maisonSubscriptionPrice}
                      className="px-3 py-2 bg-fuchsia-900/50 border border-fuchsia-700 text-fuchsia-300 rounded-lg text-[9px] font-black uppercase hover:bg-fuchsia-800/50 disabled:opacity-50 shrink-0 flex items-center gap-1"
                    >
                      <Crown size={11} /> Prolonger
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Queue info */}
            {myQueueEntry && (
              <div className="mb-4 bg-fuchsia-900/20 border border-fuchsia-700/30 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-fuchsia-300 text-xs font-bold uppercase tracking-wider">
                    En file d'attente — Position {myQueueEntry.position}
                    {getMaisonVipRank(user?.id, maisonHistory) && (
                      <span className="text-[9px] text-fuchsia-500 ml-1">(priorité VIP)</span>
                    )}
                  </span>
                  <span className="text-stone-500 text-[10px] ml-2">
                    pour {staff.find((s) => s.id === myQueueEntry.staffId)?.name || "?"}
                  </span>
                </div>
                <button
                  onClick={() => onLeaveQueue(myQueueEntry.staffId)}
                  className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold"
                >
                  Quitter
                </button>
              </div>
            )}

            {/* === CATALOGUE === */}
            {activeSection === "catalog" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {staff.length === 0 && (
                  <div className="col-span-full text-center py-20 text-fuchsia-800/50 italic">
                    Les rideaux sont tirés. Revenez plus tard.
                  </div>
                )}
                {staff.map((worker) => {
                  const isOccupied = houseRegistry.some((r) => r.staffId === worker.id);
                  const isUnavailable = worker.isAvailable === false;
                  const rating = getStaffRating(worker.id);
                  const queueCount = getQueueCount(worker.id);
                  const inMyQ = maisonQueue.some((q) => q.citizenId === user?.id && q.staffId === worker.id);
                  const loyalty = getMaisonLoyaltyDiscount(user?.id, worker.id, maisonHistory);
                  const discountPct = computeMaisonDiscount(user?.id, worker.id, maisonHistory, maisonSubscriptions);
                  const hasServices = (worker.services || []).length > 0;
                  const minSvcPrice = hasServices ? Math.min(...worker.services.map((s) => s.price || 0)) : worker.price;
                  const displayPrice = discountPct > 0
                    ? Math.max(0, Math.round(minSvcPrice * (1 - discountPct / 100)))
                    : null;

                  return (
                    <div
                      key={worker.id}
                      className={`group relative bg-stone-900/80 rounded-xl overflow-hidden border transition-all duration-500 cursor-pointer ${
                        isUnavailable || isOccupied
                          ? "border-stone-800 opacity-60"
                          : "border-fuchsia-900/50 hover:border-fuchsia-500 hover:shadow-[0_0_30px_rgba(192,38,211,0.15)]"
                      }`}
                      onClick={() => !isUnavailable && setSelectedStaff(worker)}
                    >
                      <div className="h-56 overflow-hidden relative">
                        {worker.avatarUrl ? (
                          <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-fuchsia-950 flex items-center justify-center">
                            <User size={48} className="text-fuchsia-800" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-90" />

                        {/* Badge prix / remise */}
                        <div className="absolute top-3 right-3 text-right">
                          {displayPrice !== null ? (
                            <div>
                              <div className="bg-fuchsia-900/80 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold text-fuchsia-200 line-through opacity-60">{formatMoney(hasServices ? minSvcPrice : worker.price)}</div>
                              <div className="bg-green-900/80 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold text-green-300 flex items-center gap-1 mt-0.5">
                                <Percent size={9} /> {formatMoney(displayPrice)}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-fuchsia-500/30 text-xs font-bold text-fuchsia-200">
                              {hasServices ? `dès ${formatMoney(minSvcPrice)}` : formatMoney(worker.price)}
                            </div>
                          )}
                        </div>
                        {/* Badge note */}
                        {rating.count > 0 && (
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-yellow-300 flex items-center gap-1">
                            <Star size={10} className="fill-yellow-400 text-yellow-400" /> {rating.avg}
                          </div>
                        )}
                        {/* Badge fidélité */}
                        {loyalty.visits >= 5 && (
                          <div className="absolute top-10 left-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                            <Heart size={8} fill="currentColor" /> {loyalty.visits} vis.
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <div className="flex justify-between items-end mb-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors truncate">
                            {worker.name}
                          </h3>
                          {isUnavailable ? (
                            <span className="text-[9px] font-black uppercase text-stone-400 bg-black/50 px-2 py-0.5 rounded shrink-0 ml-2 flex items-center gap-1">
                              <ShieldOff size={8} /> N/D
                            </span>
                          ) : isOccupied && (
                            <span className="text-[9px] font-black uppercase text-red-400 bg-black/50 px-2 py-0.5 rounded shrink-0 ml-2">
                              Occupée{queueCount > 0 ? ` (${queueCount})` : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 italic mb-1">{worker.specialty}</p>

                        {/* Services preview */}
                        {hasServices && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {worker.services.slice(0, 2).map((svc) => (
                              <span key={svc.id} className="text-[9px] bg-fuchsia-900/50 text-fuchsia-300 px-1.5 py-0.5 rounded border border-fuchsia-800/50">
                                {svc.name} · {formatMoney(svc.price)}
                              </span>
                            ))}
                            {worker.services.length > 2 && (
                              <span className="text-[9px] text-stone-500">+{worker.services.length - 2}</span>
                            )}
                          </div>
                        )}

                        {/* Bouton d'action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isUnavailable) return;
                            if (!isOccupied && !myQueueEntry && !myBooking) {
                              const baseP = hasServices ? minSvcPrice : worker.price;
                              const fp = Math.max(0, Math.round(baseP * (1 - discountPct / 100)));
                              if (userBalance >= fp) handleOpenBooking(worker, e);
                            } else if (isOccupied && !inMyQ && !myQueueEntry && !myBooking && onJoinQueue) {
                              onJoinQueue(worker.id);
                            } else if (inMyQ) {
                              onLeaveQueue(worker.id);
                            }
                          }}
                          className={`w-full py-2.5 rounded-lg font-black uppercase text-[9px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                            isUnavailable
                              ? "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                              : inMyQ
                              ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                              : !isOccupied && !myQueueEntry && !myBooking && userBalance >= Math.max(0, Math.round((hasServices ? minSvcPrice : worker.price) * (1 - discountPct / 100)))
                              ? "bg-fuchsia-900 hover:bg-fuchsia-700 text-white border border-fuchsia-700"
                              : isOccupied && !myQueueEntry && !myBooking
                              ? "bg-stone-800 text-stone-300 border border-stone-600 hover:bg-stone-700"
                              : "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                          }`}
                        >
                          {isUnavailable ? (
                            <><ShieldOff size={12} /> Indisponible</>
                          ) : inMyQ ? (
                            "Quitter la file"
                          ) : !isOccupied && !myQueueEntry && !myBooking ? (
                            hasServices ? <><Wrench size={12} /> Choisir un service</> : <><Heart size={12} fill="currentColor" /> Choisir</>
                          ) : isOccupied && !myQueueEntry && !myBooking ? (
                            <><Users size={12} /> File d'attente ({queueCount})</>
                          ) : (
                            "Indisponible"
                          )}
                        </button>

                        {/* Voir profil */}
                        {!isUnavailable && (
                          <div className="text-center mt-2">
                            <span className="text-[9px] text-stone-500 uppercase tracking-wider flex items-center justify-center gap-1 group-hover:text-fuchsia-400 transition-colors">
                              Voir le profil <ChevronRight size={10} />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* === HISTORIQUE === */}
            {activeSection === "history" && (
              <div className="space-y-3">
                {myHistory.length === 0 ? (
                  <div className="text-center py-16 text-fuchsia-800/50 italic">
                    Aucune visite enregistrée.
                  </div>
                ) : (
                  myHistory.map((visit) => {
                    const visitReview = maisonReviews.find((r) => r.historyId === visit.id);
                    const canReview = !visit.reviewed && !visitReview;
                    return (
                      <div key={visit.id} className="bg-stone-900/60 border border-stone-700 rounded-xl p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full border-2 border-fuchsia-800 overflow-hidden shrink-0">
                            {staff.find((s) => s.id === visit.staffId)?.avatarUrl ? (
                              <img src={staff.find((s) => s.id === visit.staffId)?.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-fuchsia-950 flex items-center justify-center">
                                <User size={20} className="text-fuchsia-800" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm">{visit.staffName}</div>
                            {visit.serviceName && (
                              <div className="text-[10px] text-fuchsia-400 italic mt-0.5">{visit.serviceName}</div>
                            )}
                            <div className="flex gap-3 text-[10px] text-stone-400 mt-0.5">
                              <span>{new Date(visit.endTime).toLocaleDateString("fr-FR")}</span>
                              <span>{visit.duration || "?"} min</span>
                              <span className="text-fuchsia-400 font-bold">{formatMoney(visit.pricePaid)}</span>
                              {(visit.discountApplied || 0) > 0 && (
                                <span className="text-green-400 flex items-center gap-0.5"><Percent size={8} /> -{visit.discountApplied}%</span>
                              )}
                            </div>
                            {visitReview && (
                              <div className="mt-1">
                                <StarRating rating={visitReview.rating} size={10} />
                              </div>
                            )}
                          </div>
                          {canReview && (
                            <button
                              onClick={() => { setReviewTarget(visit.staffId); setReviewRating(5); setReviewComment(""); }}
                              className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-yellow-800/40 transition-colors shrink-0"
                            >
                              Noter
                            </button>
                          )}
                        </div>

                        {/* Formulaire d'avis inline */}
                        {reviewTarget === visit.staffId && (
                          <div className="mt-4 pt-4 border-t border-stone-700 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-stone-400 uppercase tracking-wider">Note :</span>
                              <StarRating rating={reviewRating} size={18} interactive onChange={setReviewRating} />
                            </div>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value.slice(0, 200))}
                              placeholder="Votre avis (optionnel, 200 car. max)..."
                              className="w-full bg-stone-800 border border-stone-600 rounded-lg p-3 text-sm text-stone-200 outline-none resize-none h-20"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSubmitReview}
                                className="flex-1 py-2 bg-fuchsia-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-700 transition-colors"
                              >
                                Envoyer
                              </button>
                              <button
                                onClick={() => setReviewTarget(null)}
                                className="px-4 py-2 bg-stone-700 text-stone-300 rounded-lg text-[10px] font-bold uppercase hover:bg-stone-600 transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal profil */}
      {selectedStaff && <ProfileModal worker={selectedStaff} onClose={() => setSelectedStaff(null)} />}

      {/* Service picker modal */}
      {servicePickerWorker && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => { setServicePickerWorker(null); setSelectedServiceId(null); }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-stone-900 border border-fuchsia-800 rounded-2xl max-w-md w-full shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setServicePickerWorker(null); setSelectedServiceId(null); }} className="absolute top-4 right-4 text-stone-500 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-lg font-black text-white mb-1">{servicePickerWorker.name}</h3>
            <p className="text-fuchsia-400 text-xs italic mb-4">Choisissez un service</p>

            {(() => {
              const discountPct = computeMaisonDiscount(user?.id, servicePickerWorker.id, maisonHistory, maisonSubscriptions);
              return (
                <>
                  {discountPct > 0 && (
                    <div className="mb-3 flex items-center gap-2 p-2 bg-green-900/30 border border-green-700/30 rounded-lg text-[10px] text-green-300 font-bold">
                      <Percent size={11} /> Remise totale de {discountPct}% appliquée à vos prix
                    </div>
                  )}
                  <div className="space-y-2 mb-4">
                    {servicePickerWorker.services.map((svc) => {
                      const fp = Math.max(0, Math.round((svc.price || 0) * (1 - discountPct / 100)));
                      const cat = maisonServiceCategories.find((c) => c.id === svc.categoryId);
                      const isSelected = selectedServiceId === svc.id;
                      return (
                        <button
                          key={svc.id}
                          onClick={() => setSelectedServiceId(svc.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-fuchsia-500 bg-fuchsia-900/40" : "border-stone-700 bg-stone-800/50 hover:border-fuchsia-700"}`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{svc.name}</span>
                            {cat && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: cat.color }}>{cat.name}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {discountPct > 0 ? (
                              <>
                                <span className="text-xs text-stone-500 line-through">{formatMoney(svc.price)}</span>
                                <span className="text-xs text-green-300 font-bold">{formatMoney(fp)}</span>
                              </>
                            ) : (
                              <span className="text-xs text-fuchsia-300 font-bold">{formatMoney(svc.price)}</span>
                            )}
                            {(svc.duration || servicePickerWorker.sessionDuration || maisonDefaultDuration) && (
                              <span className="text-[10px] text-stone-500 flex items-center gap-0.5">
                                <Clock size={9} /> {svc.duration || servicePickerWorker.sessionDuration || maisonDefaultDuration} min
                              </span>
                            )}
                          </div>
                          {svc.description && <p className="text-[10px] text-stone-500 italic mt-1">{svc.description}</p>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => selectedServiceId && handleBooking(servicePickerWorker, selectedServiceId)}
                    disabled={!selectedServiceId || userBalance < Math.max(0, Math.round(((servicePickerWorker.services.find((s) => s.id === selectedServiceId)?.price || 0)) * (1 - discountPct / 100)))}
                    className="w-full py-3 bg-fuchsia-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-fuchsia-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Heart size={14} fill="currentColor" /> Confirmer la réservation
                  </button>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MaisonDeAsiaCitizen;
