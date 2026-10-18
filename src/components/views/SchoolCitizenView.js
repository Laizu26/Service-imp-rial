import React, { useState } from "react";
import {
  GraduationCap, Calendar, BookOpen, Star, Bell, Users,
  TrendingUp, Plus,
} from "lucide-react";
import Card from "../ui/Card";
import { DEFAULT_SCHOOL, SCHOOL_LIFE_EVENT_TYPES, SCHOOL_DAYS, SCHOOL_STAFF_ROLES } from "../../lib/constants";

const YEAR_LABELS = { 1: "1re année", 2: "2e année", 3: "3e année" };

export default function SchoolCitizenView({
  user,
  school: schoolProp,
  citizens = [],
  onSchoolJoinClub,
  onSchoolLeaveClub,
  onSchoolAddNote,
  onSchoolAddLifeEvent,
  onUpdateSchool,
  notify,
}) {
  const school = schoolProp || DEFAULT_SCHOOL;
  const sp = user?.schoolProfile || {};
  const isEnrolled = sp.enrolled;

  // Prof detection: check teachers[] array (new) or legacy teacherId
  const mySubjects = (school.subjects || []).filter((s) =>
    (s.teachers || (s.teacherId ? [{ id: s.teacherId }] : [])).some((t) => t.id === user?.id)
  );
  const isProf = mySubjects.length > 0;

  const [activeTab, setActiveTab] = useState("edt");

  // Prof form states
  const [profNoteStudentId, setProfNoteStudentId] = useState("");
  const [profNoteValue, setProfNoteValue] = useState("");
  const [profNoteComment, setProfNoteComment] = useState("");
  const [profEventStudentId, setProfEventStudentId] = useState("");
  const [profEventType, setProfEventType] = useState("retard");
  const [profEventDesc, setProfEventDesc] = useState("");

  if (!isEnrolled && !isProf) {
    return (
      <div className="p-6 text-center">
        <GraduationCap size={48} className="mx-auto mb-4 text-stone-300" />
        <h2 className="text-lg font-bold text-stone-600 mb-2">Accès refusé</h2>
        <p className="text-stone-400 text-sm">Vous n'êtes pas inscrit à l'Académie Impériale.<br />Contactez un administrateur impérial pour votre inscription.</p>
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

  // My schedule: slots for my year
  const mySchedule = (school.schedule || []).filter((s) => s.year === myYear || s.year === "all");

  // Notes grouped by subject
  const notesBySubject = {};
  myNotes.forEach((n) => {
    if (!notesBySubject[n.subjectId]) notesBySubject[n.subjectId] = [];
    notesBySubject[n.subjectId].push(n);
  });

  const TABS = [
    ...(isEnrolled ? [
      { id: "edt",         label: "Mon EDT",       icon: Calendar },
      { id: "notes",       label: "Mes Notes",     icon: BookOpen },
      { id: "vie_scolaire",label: "Vie Scolaire",  icon: TrendingUp },
      { id: "clubs",       label: "Clubs",         icon: Star },
      { id: "profil",      label: "Mon Profil",    icon: GraduationCap },
    ] : [
      { id: "edt",         label: "Mon EDT",       icon: Calendar },
    ]),
    { id: "annonces",    label: "Annonces",      icon: Bell },
    ...(isProf ? [{ id: "prof", label: "Mes Cours", icon: Users }] : []),
  ];

  const overall = calcAvg(myNotes);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-stone-800">{school.name || "Académie Impériale"}</h1>
          <p className="text-xs text-stone-500 italic">{school.motto}</p>
        </div>
        {isEnrolled && (
          <div className="text-right flex-shrink-0">
            <span className="block text-xs font-bold text-indigo-700">{YEAR_LABELS[sp.year]}</span>
            {overall && <span className="text-xs text-stone-500">Moy. <strong>{overall}/20</strong></span>}
          </div>
        )}
        {isProf && !isEnrolled && (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Professeur</span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-stone-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors ${
              activeTab === id
                ? "bg-white border-stone-200 text-indigo-700"
                : "bg-stone-50 border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* ── MON EDT ──────────────────────────────────────────────────────── */}
      {activeTab === "edt" && (
        <div>
          {isEnrolled && (
            <p className="text-xs text-stone-500 mb-3">Emploi du temps de votre promotion — {YEAR_LABELS[myYear]}</p>
          )}
          {!isEnrolled && isProf && (
            <p className="text-xs text-stone-500 mb-3">Vos créneaux d'enseignement</p>
          )}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SCHOOL_DAYS.map((day) => {
              const daySlots = isProf && !isEnrolled
                ? (school.schedule || []).filter((s) => s.day === day && mySubjects.some((ms) => ms.id === s.subjectId))
                : mySchedule.filter((s) => s.day === day);
              return (
                <div key={day} className="min-h-[100px]">
                  <div className="text-[10px] font-bold uppercase text-stone-500 mb-2 text-center border-b border-stone-100 pb-1">{day}</div>
                  {daySlots.length === 0 && <div className="text-[10px] text-stone-300 text-center mt-3">—</div>}
                  {daySlots.map((slot) => {
                    const subj = getSubjectById(slot.subjectId);
                    return (
                      <div key={slot.id} className="rounded-lg p-2 mb-1.5 text-[10px]" style={{ background: (subj?.color || "#64748B") + "18", borderLeft: `3px solid ${subj?.color || "#64748B"}` }}>
                        <div className="font-bold" style={{ color: subj?.color || "#64748B" }}>{subj?.icon} {subj?.name || slot.subjectId}</div>
                        <div className="text-stone-500">{slot.timeSlot}</div>
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
          {mySchedule.length === 0 && !isProf && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              Aucun cours planifié pour votre promotion.
            </div>
          )}
        </div>
      )}

      {/* ── MES NOTES ────────────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          {overall && (
            <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
              <span className="text-sm text-indigo-700 font-semibold">Moyenne générale</span>
              <span className="text-2xl font-bold text-indigo-700">{overall}<span className="text-sm font-normal">/20</span></span>
            </div>
          )}

          {(school.subjects || []).map((subj) => {
            const subjNotes = notesBySubject[subj.id] || [];
            if (!subjNotes.length) return null;
            const avg = calcAvg(subjNotes);
            return (
              <Card key={subj.id} className="border border-stone-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{subj.icon}</span>
                  <span className="font-bold text-stone-800 text-sm">{subj.name}</span>
                  {avg && <span className="ml-auto font-mono font-bold text-sm" style={{ color: subj.color }}>{avg}/20</span>}
                </div>
                <div className="space-y-1.5">
                  {subjNotes.slice().reverse().map((note) => (
                    <div key={note.id} className="flex items-start gap-3 bg-stone-50 rounded-lg px-3 py-2 text-xs border border-stone-100">
                      <span className="font-mono font-bold text-stone-700 w-10 text-right flex-shrink-0">{note.value}/20</span>
                      <div className="flex-1">
                        {note.comment && <span className="text-stone-600 italic">{note.comment}</span>}
                        <span className="text-stone-400 block mt-0.5">{note.date} · {note.teacherName || getCitizenName(note.teacherId)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {myNotes.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              Aucune note pour l'instant.
            </div>
          )}
        </div>
      )}

      {/* ── VIE SCOLAIRE ─────────────────────────────────────────────────── */}
      {activeTab === "vie_scolaire" && (
        <div className="space-y-2">
          {myLifeEvents.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              Aucun événement de vie scolaire.
            </div>
          )}
          {myLifeEvents.slice().reverse().map((evt) => {
            const typeInfo = SCHOOL_LIFE_EVENT_TYPES[evt.type] || SCHOOL_LIFE_EVENT_TYPES.retard;
            return (
              <div key={evt.id} className={`rounded-xl px-4 py-3 border ${typeInfo.bg} ${typeInfo.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.text} border ${typeInfo.border}`}>{typeInfo.label}</span>
                  <span className="text-xs text-stone-400">{evt.date}</span>
                  {evt.authorName && <span className="text-xs text-stone-400">· {evt.authorName}</span>}
                </div>
                <p className="text-sm text-stone-700">{evt.description}</p>
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
              <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Mes clubs</h3>
              {myClubs.map((club) => (
                <div key={club.id} className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-2">
                  <span className="text-2xl">{club.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-stone-800 text-sm">{club.name}</div>
                    <p className="text-xs text-stone-500">{club.description}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{(club.members || []).length} membre(s)</p>
                  </div>
                  <button onClick={() => onSchoolLeaveClub && onSchoolLeaveClub(club.id)} className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Quitter</button>
                </div>
              ))}
            </div>
          )}

          {availableClubs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Clubs disponibles</h3>
              {availableClubs.map((club) => (
                <div key={club.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 mb-2">
                  <span className="text-2xl">{club.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-stone-800 text-sm">{club.name}</div>
                    <p className="text-xs text-stone-500">{club.description}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{(club.members || []).length} membre(s)</p>
                  </div>
                  <button onClick={() => onSchoolJoinClub && onSchoolJoinClub(club.id)} className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 flex items-center gap-1"><Plus size={11} /> Rejoindre</button>
                </div>
              ))}
            </div>
          )}

          {myClubs.length === 0 && availableClubs.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <Star size={32} className="mx-auto mb-2 opacity-30" />
              Aucun club disponible pour l'instant.
            </div>
          )}
        </div>
      )}

      {/* ── MON PROFIL ───────────────────────────────────────────────────── */}
      {activeTab === "profil" && (
        <div className="space-y-4">
          <Card title="Dossier académique" icon={GraduationCap}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Promotion</p>
                <p className="font-bold text-indigo-700">{YEAR_LABELS[sp.year]}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Inscrit le</p>
                <p className="text-stone-700">{sp.enrolledAt || "—"}</p>
              </div>
              {sp.specialNote && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Note DCP</p>
                  <p className="text-stone-700 italic">{sp.specialNote}</p>
                </div>
              )}
              {overall && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Moyenne générale</p>
                  <p className="text-2xl font-bold text-indigo-700">{overall}<span className="text-sm font-normal">/20</span></p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Clubs</p>
                <div className="flex flex-wrap gap-1">
                  {myClubs.length === 0 && <span className="text-stone-400 text-xs">Aucun</span>}
                  {myClubs.map((c) => <span key={c.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{c.icon} {c.name}</span>)}
                </div>
              </div>
            </div>
          </Card>

          {/* Mini summary per subject */}
          <Card title="Résultats par matière" icon={BookOpen}>
            {(school.subjects || []).map((subj) => {
              const subjNotes = notesBySubject[subj.id] || [];
              const avg = calcAvg(subjNotes);
              return (
                <div key={subj.id} className="flex items-center gap-2 py-1.5 border-b border-stone-50 last:border-0">
                  <span className="text-base w-6">{subj.icon}</span>
                  <span className="flex-1 text-sm text-stone-700">{subj.name}</span>
                  {avg ? (
                    <span className="font-mono font-bold text-sm" style={{ color: subj.color }}>{avg}/20</span>
                  ) : (
                    <span className="text-xs text-stone-300">—</span>
                  )}
                </div>
              );
            })}
          </Card>

          {/* Life events summary */}
          {myLifeEvents.length > 0 && (
            <Card title="Vie scolaire" icon={TrendingUp}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SCHOOL_LIFE_EVENT_TYPES).map(([key, info]) => {
                  const count = myLifeEvents.filter((e) => e.type === key).length;
                  if (!count) return null;
                  return (
                    <span key={key} className={`px-2 py-1 rounded-full text-[10px] font-bold ${info.bg} ${info.text} border ${info.border}`}>
                      {count}× {info.label}
                    </span>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── PERSONNEL ────────────────────────────────────────────────────── */}
      {activeTab === "profil" && (school.staff || []).length > 0 && (
        <Card title="Personnel de l'Académie" icon={Users}>
          <div className="space-y-1">
            {SCHOOL_STAFF_ROLES.map((role) => {
              const members = (school.staff || []).filter((m) => m.role === role.id);
              if (!members.length) return null;
              return (
                <div key={role.id} className="flex items-start gap-2 py-1 border-b border-stone-50 last:border-0">
                  <span className="text-sm w-6">{role.icon}</span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase w-28 shrink-0 mt-0.5">{role.label}</span>
                  <div className="flex flex-wrap gap-1">
                    {members.map((m) => (
                      <span key={m.id} className="text-xs font-semibold text-stone-700">{m.citizenName}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── ANNONCES ─────────────────────────────────────────────────────── */}
      {activeTab === "annonces" && (
        <div className="space-y-3">
          {(school.announcements || []).length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              Aucune annonce.
            </div>
          )}
          {(school.announcements || []).slice().reverse().map((ann) => (
            <div key={ann.id} className={`rounded-xl px-4 py-3 border ${ann.important ? "bg-red-50 border-red-200" : "bg-stone-50 border-stone-200"}`}>
              {ann.important && <span className="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold uppercase mb-1">Urgent</span>}
              <p className="text-sm text-stone-800 whitespace-pre-wrap">{ann.content}</p>
              <p className="text-[10px] text-stone-400 mt-2">{ann.date} · {ann.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── MES COURS (PROF) ─────────────────────────────────────────────── */}
      {activeTab === "prof" && (
        <div className="space-y-4">
          <p className="text-xs text-stone-500">Vous enseignez {mySubjects.length} matière(s). Vous pouvez noter les élèves et ajouter des événements de vie scolaire.</p>

          {mySubjects.map((subj) => {
            // Find students enrolled in slots for this subject
            const subjectSlots = (school.schedule || []).filter((s) => s.subjectId === subj.id);
            const enrolledIds = new Set();
            subjectSlots.forEach((slot) => (slot.enrolledStudents || []).forEach((s) => enrolledIds.add(s.id)));
            const myStudents = (citizens || []).filter((c) => c.schoolProfile?.enrolled && (enrolledIds.has(c.id) || c.schoolProfile?.year === subj.year || subj.year === "all"));

            return (
              <Card key={subj.id} title={`${subj.icon} ${subj.name}`}>
                <p className="text-xs text-stone-500 mb-3">{myStudents.length} élève(s) dans cette matière</p>

                {/* Add note */}
                <div className="bg-indigo-50 rounded-xl p-3 mb-3 border border-indigo-100">
                  <p className="text-[10px] font-bold uppercase text-indigo-600 mb-2">Ajouter une note</p>
                  <div className="flex gap-2 flex-wrap">
                    <select className="p-1.5 border rounded text-xs flex-1 min-w-[120px]" value={profNoteStudentId} onChange={(e) => setProfNoteStudentId(e.target.value)}>
                      <option value="">Élève…</option>
                      {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" min={0} max={20} placeholder="/20" value={profNoteValue} onChange={(e) => setProfNoteValue(e.target.value)} />
                    <input className="flex-1 p-1.5 border rounded text-xs min-w-[100px]" placeholder="Commentaire" value={profNoteComment} onChange={(e) => setProfNoteComment(e.target.value)} />
                    <button onClick={() => {
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
                    }} disabled={!profNoteStudentId || profNoteValue === ""} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">Noter</button>
                  </div>
                </div>

                {/* Add life event */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] font-bold uppercase text-amber-600 mb-2">Vie scolaire</p>
                  <div className="flex gap-2 flex-wrap">
                    <select className="p-1.5 border rounded text-xs" value={profEventStudentId} onChange={(e) => setProfEventStudentId(e.target.value)}>
                      <option value="">Élève…</option>
                      {myStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select className="p-1.5 border rounded text-xs" value={profEventType} onChange={(e) => setProfEventType(e.target.value)}>
                      {Object.entries(SCHOOL_LIFE_EVENT_TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                    </select>
                    <input className="flex-1 p-1.5 border rounded text-xs min-w-[100px]" placeholder="Description" value={profEventDesc} onChange={(e) => setProfEventDesc(e.target.value)} />
                    <button onClick={() => {
                      if (!profEventStudentId || !profEventDesc.trim()) return;
                      onSchoolAddLifeEvent && onSchoolAddLifeEvent(profEventStudentId, {
                        type: profEventType,
                        description: profEventDesc,
                        date: new Date().toLocaleDateString("fr-FR"),
                        authorId: user?.id || "",
                        authorName: user?.name || "",
                      });
                      setProfEventStudentId(""); setProfEventDesc("");
                    }} disabled={!profEventStudentId || !profEventDesc.trim()} className="bg-amber-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">Ajouter</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
