import React, { useState } from "react";
import {
  GraduationCap, Calendar, BookOpen, Star, Bell, Users,
  TrendingUp, Plus,
} from "lucide-react";
import { DEFAULT_SCHOOL, SCHOOL_LIFE_EVENT_TYPES, SCHOOL_DAYS, SCHOOL_STAFF_ROLES } from "../../lib/constants";

const YEAR_LABELS = { 1: "1re année", 2: "2e année", 3: "3e année" };

const inputCls = "p-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400";
const btnPrimary = "flex items-center gap-1 bg-indigo-900 hover:bg-indigo-950 text-amber-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-colors";

export default function SchoolCitizenView({
  user,
  school: schoolProp,
  citizens = [],
  gameDate,
  onSchoolJoinClub,
  onSchoolLeaveClub,
  onSchoolAddNote,
  onSchoolAddLifeEvent,
  onUpdateSchool,
  notify,
}) {
  const school = schoolProp || DEFAULT_SCHOOL;
  const SCHOOL_DAYS_LOCAL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const currentDay = gameDate ? SCHOOL_DAYS_LOCAL[(gameDate.day - 1) % 7] : null;
  const viewWeek = school.currentWeek || 1;
  const sp = user?.schoolProfile || {};
  const isEnrolled = sp.enrolled;

  const mySubjects = (school.subjects || []).filter((s) =>
    (s.teachers || (s.teacherId ? [{ id: s.teacherId }] : [])).some((t) => t.id === user?.id)
  );
  const isProf = mySubjects.length > 0;

  const [activeTab, setActiveTab] = useState("edt");
  const [profNoteStudentId, setProfNoteStudentId] = useState("");
  const [profNoteValue, setProfNoteValue] = useState("");
  const [profNoteComment, setProfNoteComment] = useState("");
  const [profEventStudentId, setProfEventStudentId] = useState("");
  const [profEventType, setProfEventType] = useState("retard");
  const [profEventDesc, setProfEventDesc] = useState("");

  if (!isEnrolled && !isProf) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-indigo-900 border-4 border-amber-400/40 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-amber-300" />
          </div>
          <h2 className="text-lg font-bold text-indigo-900 mb-2">Accès Refusé</h2>
          <p className="text-sm text-stone-500 italic leading-relaxed">
            Vous n'êtes pas inscrit à l'Académie Impériale.<br />
            Contactez un administrateur impérial pour votre inscription.
          </p>
        </div>
      </div>
    );
  }

  const getCitizenName = (id) => (citizens || []).find((c) => c.id === id)?.name || id;

  const calcAvg = (notes) => {
    const nums = (notes || []).map((n) => Number(n.value)).filter((v) => !isNaN(v));
    if (!nums.length) return null;
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
  };

  const getSubjectById = (id) => (school.subjects || []).find((s) => s.id === id);

  const myNotes = sp.notes || [];
  const myLifeEvents = sp.lifeEvents || [];
  const myClubs = (school.clubs || []).filter((c) => (c.members || []).some((m) => m.id === user?.id));
  const availableClubs = (school.clubs || []).filter((c) => !(c.members || []).some((m) => m.id === user?.id));
  const myYear = sp.year;

  const mySchedule = (school.schedule || []).filter((s) => s.year === myYear || s.year === "all");

  const notesBySubject = {};
  myNotes.forEach((n) => {
    if (!notesBySubject[n.subjectId]) notesBySubject[n.subjectId] = [];
    notesBySubject[n.subjectId].push(n);
  });

  const TABS = [
    ...(isEnrolled ? [
      { id: "edt",          label: "Mon EDT",      icon: Calendar },
      { id: "notes",        label: "Mes Notes",    icon: BookOpen },
      { id: "vie_scolaire", label: "Vie Scolaire", icon: TrendingUp },
      { id: "clubs",        label: "Clubs",        icon: Star },
      { id: "profil",       label: "Mon Profil",   icon: GraduationCap },
    ] : [
      { id: "edt",          label: "Mon EDT",      icon: Calendar },
    ]),
    { id: "annonces", label: "Annonces", icon: Bell },
    ...(isProf ? [{ id: "prof", label: "Mes Cours", icon: Users }] : []),
  ];

  const overall = calcAvg(myNotes);

  return (
    <div className="p-3 max-w-4xl mx-auto space-y-3">

      {/* ── HEADER — Imperial Banner ──────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-400/15 border-2 border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={22} className="text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">{school.name || "Académie Impériale"}</h1>
            {school.motto && <p className="text-[11px] text-indigo-300 italic mt-0.5">{school.motto}</p>}
          </div>
          {isEnrolled && (
            <div className="text-right flex-shrink-0">
              <span className="block text-[9px] text-indigo-400 uppercase tracking-widest">Promotion</span>
              <span className="block text-xs font-bold text-amber-300">{YEAR_LABELS[sp.year]}</span>
              {overall && <span className="text-[10px] text-white/60">Moy. <strong className="text-amber-300">{overall}/20</strong></span>}
            </div>
          )}
          {isProf && !isEnrolled && (
            <span className="px-3 py-1 bg-amber-400/15 border border-amber-400/30 text-amber-300 rounded-full text-[11px] font-bold">⚜️ Professeur</span>
          )}
        </div>
        <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-1 flex gap-0.5 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === id
                ? "bg-indigo-900 text-amber-300 shadow-sm"
                : "text-amber-800 hover:bg-amber-100"
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* ── MON EDT ──────────────────────────────────────────────────────── */}
      {activeTab === "edt" && (
        <div>
          <div className="flex items-center gap-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-xs font-bold text-stone-600">Semaine {viewWeek}</span>
            {currentDay && (
              <span className="text-xs text-indigo-700 font-semibold">
                · Aujourd'hui : <strong>{currentDay}</strong>
              </span>
            )}
            {isEnrolled && <span className="text-xs text-stone-400 ml-auto">{YEAR_LABELS[myYear]}</span>}
            {!isEnrolled && isProf && <span className="text-xs text-stone-400 ml-auto">Vos créneaux</span>}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-7">
            {SCHOOL_DAYS.map((day) => {
              const isToday = day === currentDay;
              const allDaySlots = isProf && !isEnrolled
                ? (school.schedule || []).filter((s) => s.day === day && mySubjects.some((ms) => ms.id === s.subjectId))
                : mySchedule.filter((s) => s.day === day);
              const daySlots = allDaySlots.filter((s) => s.week == null || s.week === viewWeek);
              return (
                <div
                  key={day}
                  className={`min-h-[90px] rounded-xl border p-1.5 transition-all ${
                    isToday
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/50"
                      : "bg-stone-50/60 border-stone-100"
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase mb-1.5 text-center pb-1 border-b ${
                    isToday ? "text-amber-700 border-amber-200" : "text-stone-400 border-stone-100"
                  }`}>
                    {day.slice(0, 3)}{isToday && " ✦"}
                  </div>
                  {daySlots.length === 0 && <div className="text-[10px] text-stone-300 text-center mt-3">—</div>}
                  {daySlots.map((slot) => {
                    const subj = getSubjectById(slot.subjectId);
                    return (
                      <div
                        key={slot.id}
                        className="rounded-lg p-1.5 mb-1 text-[10px]"
                        style={{ background: (subj?.color || "#64748B") + "18", borderLeft: `3px solid ${subj?.color || "#64748B"}` }}
                      >
                        <div className="font-bold leading-tight" style={{ color: subj?.color || "#64748B" }}>
                          {subj?.icon} {subj?.name || slot.subjectId}
                        </div>
                        <div className="text-stone-500 mt-0.5">{slot.timeSlot}</div>
                        {slot.room && <div className="text-stone-400 italic">{slot.room}</div>}
                        {(subj?.teachers?.length > 0 || subj?.teacherName) && (
                          <div className="text-stone-400 mt-0.5">↳ {subj.teachers?.map((t) => t.name).join(", ") || subj.teacherName}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {mySchedule.filter((s) => s.week == null || s.week === viewWeek).length === 0 && !isProf && (
            <div className="text-center py-10 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl mt-3">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun cours planifié pour cette semaine.</p>
            </div>
          )}
        </div>
      )}

      {/* ── MES NOTES ────────────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          {overall && (
            <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 rounded-xl px-5 py-4 flex items-center justify-between shadow-md">
              <div>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest mb-1">Moyenne générale</p>
                <p className="text-3xl font-black text-amber-300">
                  {overall}<span className="text-sm font-normal text-white/50">/20</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-400/15 border-2 border-amber-400/30 flex items-center justify-center">
                <BookOpen size={20} className="text-amber-300" />
              </div>
            </div>
          )}

          {(school.subjects || []).map((subj) => {
            const subjNotes = notesBySubject[subj.id] || [];
            if (!subjNotes.length) return null;
            const avg = calcAvg(subjNotes);
            return (
              <div key={subj.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-white border-b border-amber-100"
                  style={{ borderLeft: `4px solid ${subj.color || "#64748B"}` }}
                >
                  <span className="text-lg">{subj.icon}</span>
                  <span className="font-bold text-stone-800 flex-1 text-sm">{subj.name}</span>
                  {avg && (
                    <span className="font-mono font-black text-lg" style={{ color: subj.color }}>
                      {avg}<span className="text-xs font-normal text-stone-400">/20</span>
                    </span>
                  )}
                </div>
                <div className="divide-y divide-amber-100/80">
                  {subjNotes.slice().reverse().map((note) => (
                    <div key={note.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
                        style={{ background: (subj.color || "#64748B") + "20", color: subj.color || "#64748B", borderColor: (subj.color || "#64748B") + "50" }}
                      >
                        {note.value}
                      </div>
                      <div className="flex-1 min-w-0">
                        {note.comment && <p className="text-xs text-stone-700 italic">{note.comment}</p>}
                        <p className="text-[10px] text-stone-400 mt-0.5">{note.date} · {note.teacherName || getCitizenName(note.teacherId)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {myNotes.length === 0 && (
            <div className="text-center py-10 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune note pour l'instant.</p>
            </div>
          )}
        </div>
      )}

      {/* ── VIE SCOLAIRE ─────────────────────────────────────────────────── */}
      {activeTab === "vie_scolaire" && (
        <div className="space-y-2">
          {myLifeEvents.length === 0 && (
            <div className="text-center py-10 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun événement de vie scolaire.</p>
            </div>
          )}
          {myLifeEvents.slice().reverse().map((evt) => {
            const typeInfo = SCHOOL_LIFE_EVENT_TYPES[evt.type] || SCHOOL_LIFE_EVENT_TYPES.retard;
            return (
              <div key={evt.id} className={`rounded-xl border overflow-hidden shadow-sm ${typeInfo.border}`}>
                <div className={`px-4 py-2 flex items-center gap-2 ${typeInfo.bg} border-b ${typeInfo.border}`}>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${typeInfo.text}`}>{typeInfo.label}</span>
                  <span className="text-xs text-stone-500">{evt.date}</span>
                  {evt.authorName && <span className="text-xs text-stone-400 ml-auto">⚜️ {evt.authorName}</span>}
                </div>
                <div className="px-4 py-3 bg-amber-50/60">
                  <p className="text-sm text-stone-700">{evt.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CLUBS ────────────────────────────────────────────────────────── */}
      {activeTab === "clubs" && (
        <div className="space-y-4">
          {myClubs.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 px-1">Mes clubs</h3>
              <div className="space-y-2">
                {myClubs.map((club) => (
                  <div key={club.id} className="flex items-center gap-3 bg-gradient-to-r from-indigo-950 to-indigo-900 rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-11 h-11 rounded-full bg-amber-400/15 border-2 border-amber-400/30 flex items-center justify-center text-xl flex-shrink-0">
                      {club.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">{club.name}</div>
                      <p className="text-[11px] text-indigo-300">{club.description}</p>
                      <p className="text-[10px] text-indigo-400 mt-0.5">⚔️ {(club.members || []).length} membre(s)</p>
                    </div>
                    <button
                      onClick={() => onSchoolLeaveClub && onSchoolLeaveClub(club.id)}
                      className="text-[11px] text-red-300 border border-red-400/40 bg-red-900/30 px-3 py-1 rounded-lg hover:bg-red-900/50 transition-colors"
                    >Quitter</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableClubs.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 px-1">Clubs disponibles</h3>
              <div className="space-y-2">
                {availableClubs.map((club) => (
                  <div key={club.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xl flex-shrink-0">
                      {club.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-800 text-sm">{club.name}</div>
                      <p className="text-[11px] text-stone-500">{club.description}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">⚔️ {(club.members || []).length} membre(s)</p>
                    </div>
                    <button
                      onClick={() => onSchoolJoinClub && onSchoolJoinClub(club.id)}
                      className="text-[11px] text-indigo-700 border border-indigo-200 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={10} /> Rejoindre
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {myClubs.length === 0 && availableClubs.length === 0 && (
            <div className="text-center py-10 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl">
              <Star size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun club disponible pour l'instant.</p>
            </div>
          )}
        </div>
      )}

      {/* ── MON PROFIL ───────────────────────────────────────────────────── */}
      {activeTab === "profil" && (
        <div className="space-y-3">
          {/* Imperial ID card */}
          <div className="rounded-2xl overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-400/15 border-2 border-amber-400/40 flex items-center justify-center text-3xl flex-shrink-0">
                  ⚜️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Dossier Académique</p>
                  <p className="text-base font-bold text-white leading-tight">{user?.name}</p>
                  <p className="text-xs text-amber-300 font-semibold">{YEAR_LABELS[sp.year]}</p>
                </div>
                {overall && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] text-indigo-400 uppercase">Moyenne</p>
                    <p className="text-3xl font-black text-amber-300 leading-none">{overall}</p>
                    <p className="text-[10px] text-white/40">/20</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Inscrit le</p>
                  <p className="text-white mt-0.5">{sp.enrolledAt || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Clubs</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {myClubs.length === 0 && <span className="text-white/40 text-[11px]">Aucun</span>}
                    {myClubs.map((c) => (
                      <span key={c.id} className="text-[11px] bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                        {c.icon} {c.name}
                      </span>
                    ))}
                  </div>
                </div>
                {sp.specialNote && (
                  <div className="col-span-2">
                    <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Note DCP</p>
                    <p className="text-indigo-100 italic mt-0.5">{sp.specialNote}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
          </div>

          {/* Results by subject */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-white border-b border-amber-100 flex items-center gap-2">
              <BookOpen size={14} className="text-amber-700" />
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">Résultats par matière</span>
            </div>
            <div className="divide-y divide-amber-100">
              {(school.subjects || []).map((subj) => {
                const subjNotes = notesBySubject[subj.id] || [];
                const avg = calcAvg(subjNotes);
                return (
                  <div key={subj.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base w-6 flex-shrink-0">{subj.icon}</span>
                    <span className="flex-1 text-sm text-stone-700">{subj.name}</span>
                    {avg ? (
                      <span className="font-mono font-black text-sm" style={{ color: subj.color }}>{avg}/20</span>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Life events summary */}
          {myLifeEvents.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-white border-b border-amber-100 flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-700" />
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">Vie scolaire</span>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {Object.entries(SCHOOL_LIFE_EVENT_TYPES).map(([key, info]) => {
                  const count = myLifeEvents.filter((e) => e.type === key).length;
                  if (!count) return null;
                  return (
                    <span key={key} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${info.bg} ${info.text} border ${info.border}`}>
                      {count}× {info.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PERSONNEL (on profil tab) ─────────────────────────────────────── */}
      {activeTab === "profil" && (school.staff || []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-white border-b border-amber-100 flex items-center gap-2">
            <Users size={14} className="text-amber-700" />
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">Personnel de l'Académie</span>
          </div>
          <div className="divide-y divide-amber-100">
            {SCHOOL_STAFF_ROLES.map((role) => {
              const members = (school.staff || []).filter((m) => m.role === role.id);
              if (!members.length) return null;
              return (
                <div key={role.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-sm w-6 flex-shrink-0">{role.icon}</span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase w-28 shrink-0">{role.label}</span>
                  <div className="flex flex-wrap gap-1">
                    {members.map((m) => (
                      <span key={m.id} className="text-xs font-semibold text-stone-700">{m.citizenName}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ANNONCES ─────────────────────────────────────────────────────── */}
      {activeTab === "annonces" && (
        <div className="space-y-3">
          {(school.announcements || []).length === 0 && (
            <div className="text-center py-10 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune annonce.</p>
            </div>
          )}
          {(school.announcements || []).slice().reverse().map((ann) => (
            <div key={ann.id} className={`rounded-xl overflow-hidden border shadow-sm ${ann.important ? "border-red-300" : "border-amber-200"}`}>
              {ann.important && (
                <div className="bg-red-700 px-4 py-1.5">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">⚠️ Proclamation Urgente</span>
                </div>
              )}
              <div className={`px-4 py-4 ${ann.important ? "bg-red-50" : "bg-amber-50/80"}`}>
                <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center gap-2">
                  <span className="text-[10px] text-stone-400">⚜️ {ann.authorName}</span>
                  <span className="text-[10px] text-stone-400 ml-auto">{ann.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MES COURS (PROF) ─────────────────────────────────────────────── */}
      {activeTab === "prof" && (
        <div className="space-y-4">
          <p className="text-xs text-stone-500 px-1">
            Vous enseignez {mySubjects.length} matière(s). Vous pouvez noter les élèves et ajouter des événements de vie scolaire.
          </p>

          {mySubjects.map((subj) => {
            const subjectSlots = (school.schedule || []).filter((s) => s.subjectId === subj.id);
            const enrolledIds = new Set();
            subjectSlots.forEach((slot) => (slot.enrolledStudents || []).forEach((s) => enrolledIds.add(s.id)));
            const myStudents = (citizens || []).filter(
              (c) => c.schoolProfile?.enrolled && (enrolledIds.has(c.id) || c.schoolProfile?.year === subj.year || subj.year === "all")
            );

            return (
              <div key={subj.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                <div
                  className="flex items-center gap-2 px-4 py-3 bg-white border-b border-amber-100"
                  style={{ borderLeft: `4px solid ${subj.color || "#64748B"}` }}
                >
                  <span className="text-base">{subj.icon}</span>
                  <span className="font-bold text-stone-800 text-sm flex-1">{subj.name}</span>
                  <span className="text-[10px] text-stone-400">{myStudents.length} élève(s)</span>
                </div>
                <div className="p-3 space-y-3">
                  {/* Add note */}
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-[10px] font-bold uppercase text-indigo-700 mb-2">Ajouter une note</p>
                    <div className="flex gap-2 flex-wrap">
                      <select className={`${inputCls} flex-1 min-w-[120px]`} value={profNoteStudentId} onChange={(e) => setProfNoteStudentId(e.target.value)}>
                        <option value="">Élève…</option>
                        {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <input className={`${inputCls} w-16 font-mono`} type="number" min={0} max={20} placeholder="/20" value={profNoteValue} onChange={(e) => setProfNoteValue(e.target.value)} />
                      <input className={`${inputCls} flex-1 min-w-[100px]`} placeholder="Commentaire" value={profNoteComment} onChange={(e) => setProfNoteComment(e.target.value)} />
                      <button
                        onClick={() => {
                          if (!profNoteStudentId || profNoteValue === "") return;
                          onSchoolAddNote && onSchoolAddNote(profNoteStudentId, {
                            subjectId: subj.id,
                            subjectName: subj.name,
                            value: Number(profNoteValue),
                            comment: profNoteComment,
                            date: new Date().toLocaleDateString("fr-FR"),
                            teacherId: user?.id || "",
                            teacherName: user?.name || "",
                          });
                          setProfNoteStudentId(""); setProfNoteValue(""); setProfNoteComment("");
                        }}
                        disabled={!profNoteStudentId || profNoteValue === ""}
                        className={btnPrimary}
                      >Noter</button>
                    </div>
                  </div>

                  {/* Add life event */}
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-[10px] font-bold uppercase text-amber-700 mb-2">Vie scolaire</p>
                    <div className="flex gap-2 flex-wrap">
                      <select className={inputCls} value={profEventStudentId} onChange={(e) => setProfEventStudentId(e.target.value)}>
                        <option value="">Élève…</option>
                        {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <select className={inputCls} value={profEventType} onChange={(e) => setProfEventType(e.target.value)}>
                        {Object.entries(SCHOOL_LIFE_EVENT_TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                      </select>
                      <input className={`${inputCls} flex-1 min-w-[100px]`} placeholder="Description" value={profEventDesc} onChange={(e) => setProfEventDesc(e.target.value)} />
                      <button
                        onClick={() => {
                          if (!profEventStudentId || !profEventDesc.trim()) return;
                          onSchoolAddLifeEvent && onSchoolAddLifeEvent(profEventStudentId, {
                            type: profEventType,
                            description: profEventDesc,
                            date: new Date().toLocaleDateString("fr-FR"),
                            authorId: user?.id || "",
                            authorName: user?.name || "",
                          });
                          setProfEventStudentId(""); setProfEventDesc("");
                        }}
                        disabled={!profEventStudentId || !profEventDesc.trim()}
                        className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-colors"
                      >Ajouter</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
