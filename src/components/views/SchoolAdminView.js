import React, { useState } from "react";
import {
  Plus, Trash2, X, Save, GraduationCap, BookOpen, Calendar, Users,
  Star, Bell, Pencil, ChevronDown, ChevronUp,
} from "lucide-react";
import UserSearchSelect from "../ui/UserSearchSelect";
import { DEFAULT_SCHOOL, SCHOOL_LIFE_EVENT_TYPES, SCHOOL_DAYS, SCHOOL_TIME_SLOTS, SCHOOL_STAFF_ROLES } from "../../lib/constants";

const SUBJECT_COLORS = [
  "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2",
  "#64748B", "#0D9488", "#9333EA", "#EA580C", "#BE185D",
];

const YEAR_LABELS = { 1: "1re année", 2: "2e année", 3: "3e année" };

const inputCls = "p-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full";
const btnPrimary = "flex items-center gap-1 bg-indigo-900 hover:bg-indigo-950 text-amber-300 px-4 py-1.5 rounded-lg text-xs font-bold uppercase disabled:opacity-50 transition-colors";
const btnDanger = "text-red-400 hover:text-red-600 p-1 transition-colors";

export default function SchoolAdminView({
  school: schoolProp,
  citizens = [],
  session,
  roleInfo,
  gameDate,
  onUpdateSchool,
  onSchoolEnroll,
  onSchoolUnenroll,
  onSchoolPromote,
  onSchoolAddNote,
  onSchoolDeleteNote,
  onSchoolAddLifeEvent,
  onSchoolDeleteLifeEvent,
  notify,
}) {
  const school = schoolProp || DEFAULT_SCHOOL;

  const SCHOOL_DAYS_LOCAL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const currentDay = gameDate ? SCHOOL_DAYS_LOCAL[(gameDate.day - 1) % 7] : null;
  const viewWeek = school.currentWeek || 1;

  const [activeTab, setActiveTab] = useState("matieres");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedStudentTab, setExpandedStudentTab] = useState("notes");

  // Matières form
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");
  const [newSubjectIcon, setNewSubjectIcon] = useState("📜");
  const [newSubjectYear, setNewSubjectYear] = useState("all");
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectDesc, setEditSubjectDesc] = useState("");

  // EDT form
  const [edtYearFilter, setEdtYearFilter] = useState(1);
  const [showNewSlot, setShowNewSlot] = useState(false);
  const [slotSubjectId, setSlotSubjectId] = useState("");
  const [slotDay, setSlotDay] = useState("Lundi");
  const [slotTime, setSlotTime] = useState("Matin");
  const [slotRoom, setSlotRoom] = useState("");
  const [slotWeekType, setSlotWeekType] = useState("recurring");
  const [slotYear, setSlotYear] = useState(1);

  // Élèves form
  const [enrollCitizenId, setEnrollCitizenId] = useState("");
  const [enrollYear, setEnrollYear] = useState(1);
  const [noteSubjectId, setNoteSubjectId] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [noteComment, setNoteComment] = useState("");
  const [lifeEventType, setLifeEventType] = useState("retard");
  const [lifeEventDesc, setLifeEventDesc] = useState("");

  // Clubs form
  const [showNewClub, setShowNewClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubIcon, setNewClubIcon] = useState("🏆");

  // Annonces form
  const [showNewAnnonce, setShowNewAnnonce] = useState(false);
  const [annonceContent, setAnnonceContent] = useState("");
  const [annonceImportant, setAnnonceImportant] = useState(false);

  const enrolledStudents = citizens.filter((c) => c.schoolProfile?.enrolled);

  const handleSave = (updates) => onUpdateSchool({ ...school, ...updates });

  const getSubjectName = (id) => (school.subjects || []).find((s) => s.id === id)?.name || id;
  const getCitizenName = (id) => (citizens || []).find((c) => c.id === id)?.name || id;

  const calcAvg = (notes) => {
    const nums = (notes || []).map((n) => Number(n.value)).filter((v) => !isNaN(v));
    if (!nums.length) return null;
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
  };

  const TABS = [
    { id: "matieres",  label: "Matières",  icon: BookOpen },
    { id: "edt",       label: "EDT",       icon: Calendar },
    { id: "eleves",    label: "Élèves",    icon: Users },
    { id: "personnel", label: "Personnel", icon: Users },
    { id: "clubs",     label: "Clubs",     icon: Star },
    { id: "annonces",  label: "Annonces",  icon: Bell },
  ];

  return (
    <div className="p-3 max-w-6xl mx-auto space-y-3">

      {/* ── HEADER — Imperial Admin Banner ───────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-400/15 border-2 border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={22} className="text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">{school.name || "Académie Impériale"}</h1>
            <p className="text-[11px] text-indigo-300 italic mt-0.5">{school.motto || "Administration DCP"}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Statut</p>
              <span className={`text-xs font-bold ${school.active ? "text-green-300" : "text-red-300"}`}>
                {school.active ? "⬤ Ouverte" : "⬤ Fermée"}
              </span>
            </div>
            <button
              onClick={() => handleSave({ active: !school.active })}
              className="text-[11px] px-3 py-1.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg transition-colors"
            >
              {school.active ? "Fermer" : "Ouvrir"}
            </button>
          </div>
        </div>
        {/* Stats bar */}
        <div className="bg-indigo-900/80 px-5 py-2 flex gap-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-lg font-black text-amber-300 leading-none">{enrolledStudents.length}</p>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Étudiants</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-amber-300 leading-none">{(school.subjects || []).length}</p>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Matières</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-amber-300 leading-none">{(school.clubs || []).length}</p>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Clubs</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-amber-300 leading-none">{viewWeek}</p>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest">Semaine</p>
          </div>
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
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── MATIÈRES ─────────────────────────────────────────────────────── */}
      {activeTab === "matieres" && (
        <div className="space-y-2">
          {(school.subjects || []).map((subj) => (
            <div key={subj.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-start gap-3 p-4" style={{ borderLeft: `4px solid ${subj.color || "#64748B"}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: (subj.color || "#64748B") + "22" }}>
                  {subj.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {editingSubjectId === subj.id ? (
                    <div className="space-y-2">
                      <input className={inputCls} style={{ fontWeight: "bold" }} value={editSubjectName} onChange={(e) => setEditSubjectName(e.target.value)} />
                      <textarea className={inputCls} rows={2} value={editSubjectDesc} onChange={(e) => setEditSubjectDesc(e.target.value)} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleSave({ subjects: (school.subjects || []).map((s) => s.id === subj.id ? { ...s, name: editSubjectName || s.name, description: editSubjectDesc } : s) });
                            setEditingSubjectId(null);
                          }}
                          className={btnPrimary}
                        ><Save size={11} /> Enregistrer</button>
                        <button onClick={() => setEditingSubjectId(null)} className="text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg text-xs">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-800 text-sm">{subj.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: (subj.color || "#64748B") + "22", color: subj.color || "#64748B" }}>
                          {subj.year === "all" ? "Toutes années" : YEAR_LABELS[subj.year]}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{subj.description}</p>
                      {(subj.teachers || (subj.teacherId ? [{ id: subj.teacherId, name: subj.teacherName }] : [])).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(subj.teachers || [{ id: subj.teacherId, name: subj.teacherName }]).map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingSubjectId(subj.id); setEditSubjectName(subj.name); setEditSubjectDesc(subj.description || ""); }} className="text-stone-400 hover:text-stone-600 p-1"><Pencil size={13} /></button>
                  <button onClick={() => handleSave({ subjects: (school.subjects || []).filter((s) => s.id !== subj.id) })} className={btnDanger}><Trash2 size={13} /></button>
                </div>
              </div>

              {editingSubjectId !== subj.id && (
                <div className="px-4 pb-4 pt-2 border-t border-amber-100 bg-white/40">
                  <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">Professeurs</p>
                  {(subj.teachers || (subj.teacherId ? [{ id: subj.teacherId, name: subj.teacherName }] : [])).map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-1 px-2 mb-1 rounded-lg bg-indigo-50 border border-indigo-100">
                      <span className="text-xs font-semibold text-indigo-800">{t.name}</span>
                      <button
                        onClick={() => {
                          const current = subj.teachers || (subj.teacherId ? [{ id: subj.teacherId, name: subj.teacherName }] : []);
                          handleSave({ subjects: (school.subjects || []).map((s) => s.id === subj.id ? { ...s, teachers: current.filter((x) => x.id !== t.id), teacherId: null, teacherName: null } : s) });
                        }}
                        className="text-red-400 hover:text-red-600 ml-2"
                      ><X size={11} /></button>
                    </div>
                  ))}
                  <UserSearchSelect
                    users={citizens.filter((c) => !(subj.teachers || (subj.teacherId ? [{ id: subj.teacherId }] : [])).some((t) => t.id === c.id))}
                    value={null}
                    onSelect={(selectedId) => {
                      if (!selectedId) return;
                      const citizen = citizens.find((c) => c.id === selectedId);
                      if (!citizen) return;
                      const current = subj.teachers || (subj.teacherId ? [{ id: subj.teacherId, name: subj.teacherName }] : []);
                      if (current.some((t) => t.id === citizen.id)) return;
                      handleSave({ subjects: (school.subjects || []).map((s) => s.id === subj.id ? { ...s, teachers: [...current, { id: citizen.id, name: citizen.name }], teacherId: null, teacherName: null } : s) });
                    }}
                    placeholder="Ajouter un professeur..."
                  />
                </div>
              )}
            </div>
          ))}

          {showNewSubject ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wide">⚜️ Nouvelle matière</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input className="w-12 p-1.5 border border-amber-200 rounded-lg text-sm text-center bg-white" placeholder="📜" value={newSubjectIcon} onChange={(e) => setNewSubjectIcon(e.target.value)} />
                  <input className="flex-1 p-1.5 border border-amber-200 rounded-lg text-sm bg-white" placeholder="Nom de la matière" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
                </div>
                <textarea className={inputCls} rows={2} placeholder="Description" value={newSubjectDesc} onChange={(e) => setNewSubjectDesc(e.target.value)} />
                <div className="flex gap-3 items-center flex-wrap">
                  <select className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white" value={newSubjectYear} onChange={(e) => setNewSubjectYear(e.target.value === "all" ? "all" : Number(e.target.value))}>
                    <option value="all">Toutes années</option>
                    <option value={1}>1re année</option>
                    <option value={2}>2e année</option>
                    <option value={3}>3e année</option>
                  </select>
                  <div className="flex gap-1">
                    {SUBJECT_COLORS.map((c) => (
                      <button key={c} onClick={() => setNewSubjectColor(c)} className={`w-5 h-5 rounded-full border-2 ${newSubjectColor === c ? "border-stone-800 scale-110" : "border-transparent"} transition-transform`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (!newSubjectName.trim()) return;
                      const subj = { id: `subj_${Date.now()}`, name: newSubjectName.trim(), description: newSubjectDesc, icon: newSubjectIcon, year: newSubjectYear, teachers: [], color: newSubjectColor };
                      handleSave({ subjects: [...(school.subjects || []), subj] });
                      setNewSubjectName(""); setNewSubjectDesc(""); setNewSubjectIcon("📜"); setNewSubjectYear("all"); setShowNewSubject(false);
                    }}
                    className={btnPrimary}
                  ><Plus size={12} /> Créer</button>
                  <button onClick={() => setShowNewSubject(false)} className="text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg text-xs">Annuler</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewSubject(true)}
              className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-indigo-400 hover:text-indigo-700 text-sm flex items-center justify-center gap-2 transition-colors bg-amber-50/50"
            >
              <Plus size={16} /> Ajouter une matière
            </button>
          )}
        </div>
      )}

      {/* ── EDT ──────────────────────────────────────────────────────────── */}
      {activeTab === "edt" && (
        <div className="space-y-3">
          {/* Week navigation */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Semaine</span>
              <span className="text-2xl font-black text-indigo-900">{viewWeek}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave({ currentWeek: Math.max(1, viewWeek - 1) })}
                disabled={viewWeek <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-40 transition-colors"
              >← Préc.</button>
              <button
                onClick={() => {
                  const nextWeek = viewWeek + 1;
                  const copied = (school.schedule || [])
                    .filter((s) => s.week === viewWeek)
                    .map((s) => ({ ...s, id: `slot_${Date.now()}_${Math.random().toString(36).slice(2)}`, week: nextWeek }));
                  handleSave({ schedule: [...(school.schedule || []), ...copied], currentWeek: nextWeek });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
              >Copier → Sem. suiv.</button>
              <button
                onClick={() => handleSave({ currentWeek: viewWeek + 1 })}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
              >Suiv. →</button>
            </div>
            {currentDay && (
              <div className="text-xs text-stone-500">
                Aujourd'hui : <strong className="text-indigo-800">{currentDay}</strong>
              </div>
            )}
          </div>

          {/* Year filter */}
          <div className="flex gap-2">
            {[1, 2, 3].map((y) => (
              <button
                key={y}
                onClick={() => setEdtYearFilter(y)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  edtYearFilter === y ? "bg-indigo-900 text-amber-300" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                }`}
              >
                {YEAR_LABELS[y]}
              </button>
            ))}
          </div>

          {/* Weekly grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {SCHOOL_DAYS.map((day) => {
              const isToday = day === currentDay;
              const daySlots = (school.schedule || []).filter((s) =>
                s.day === day &&
                (s.year === edtYearFilter || s.year === "all") &&
                (s.week == null || s.week === viewWeek)
              );
              return (
                <div
                  key={day}
                  className={`min-h-[120px] rounded-xl border p-1.5 transition-all ${
                    isToday ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/50" : "bg-stone-50/50 border-stone-100"
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase mb-2 text-center pb-1 border-b ${
                    isToday ? "text-amber-700 border-amber-200" : "text-stone-400 border-stone-100"
                  }`}>
                    {day.slice(0, 3)}{isToday && " ✦"}
                  </div>
                  {daySlots.length === 0 && <div className="text-[10px] text-stone-300 text-center mt-4">—</div>}
                  {daySlots.map((slot) => {
                    const subj = (school.subjects || []).find((s) => s.id === slot.subjectId);
                    return (
                      <div
                        key={slot.id}
                        className="rounded-lg p-1.5 mb-1.5 text-[10px] relative group"
                        style={{ background: (subj?.color || "#64748B") + "20", borderLeft: `3px solid ${subj?.color || "#64748B"}` }}
                      >
                        <div className="font-bold leading-tight" style={{ color: subj?.color || "#64748B" }}>{subj?.icon} {subj?.name || slot.subjectId}</div>
                        <div className="text-stone-500">{slot.timeSlot}</div>
                        {slot.room && <div className="text-stone-400 italic">{slot.room}</div>}
                        <div className="text-stone-400">{(slot.enrolledStudents || []).length} élève(s)</div>
                        {slot.week != null && <div className="text-[9px] text-indigo-400 mt-0.5">Sem. {slot.week}</div>}
                        <button
                          onClick={() => handleSave({ schedule: (school.schedule || []).filter((s) => s.id !== slot.id) })}
                          className="absolute top-1 right-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        ><X size={10} /></button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Add slot form */}
          {showNewSlot ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wide">⚜️ Nouveau créneau</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Matière</label>
                  <select className={inputCls} value={slotSubjectId} onChange={(e) => setSlotSubjectId(e.target.value)}>
                    <option value="">— Choisir —</option>
                    {(school.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Année</label>
                  <select className={inputCls} value={slotYear} onChange={(e) => setSlotYear(Number(e.target.value))}>
                    {[1, 2, 3].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Jour</label>
                  <select className={inputCls} value={slotDay} onChange={(e) => setSlotDay(e.target.value)}>
                    {SCHOOL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Créneau</label>
                  <select className={inputCls} value={slotTime} onChange={(e) => setSlotTime(e.target.value)}>
                    {SCHOOL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Salle (optionnel)</label>
                  <input className={inputCls} value={slotRoom} onChange={(e) => setSlotRoom(e.target.value)} placeholder="Ex: Salle des Lettres" />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Semaine</label>
                  <select className={inputCls} value={slotWeekType} onChange={(e) => setSlotWeekType(e.target.value)}>
                    <option value="recurring">Récurrent (toutes semaines)</option>
                    <option value="specific">Semaine {viewWeek} seulement</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (!slotSubjectId) return;
                    const subj = (school.subjects || []).find((s) => s.id === slotSubjectId);
                    const slot = {
                      id: `slot_${Date.now()}`,
                      subjectId: slotSubjectId,
                      subjectName: subj?.name || "",
                      day: slotDay,
                      timeSlot: slotTime,
                      room: slotRoom,
                      year: slotYear,
                      week: slotWeekType === "specific" ? viewWeek : null,
                      enrolledStudents: [],
                    };
                    handleSave({ schedule: [...(school.schedule || []), slot] });
                    setSlotSubjectId(""); setSlotRoom(""); setShowNewSlot(false);
                  }}
                  className={btnPrimary}
                ><Plus size={12} /> Créer</button>
                <button onClick={() => setShowNewSlot(false)} className="text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg text-xs">Annuler</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewSlot(true)}
              className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-indigo-400 hover:text-indigo-700 text-sm flex items-center justify-center gap-2 transition-colors bg-amber-50/50"
            >
              <Plus size={16} /> Ajouter un créneau
            </button>
          )}
        </div>
      )}

      {/* ── ÉLÈVES ───────────────────────────────────────────────────────── */}
      {activeTab === "eleves" && (
        <div className="space-y-3">
          {/* Inscrire */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={14} className="text-amber-700" />
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">Inscrire un étudiant</span>
            </div>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <UserSearchSelect
                  users={citizens.filter((c) => !c.schoolProfile?.enrolled)}
                  value={enrollCitizenId}
                  onSelect={(selectedId) => setEnrollCitizenId(selectedId || "")}
                  placeholder="Chercher un citoyen..."
                />
              </div>
              <select className="p-2 border border-amber-200 rounded-lg text-xs bg-white" value={enrollYear} onChange={(e) => setEnrollYear(Number(e.target.value))}>
                {[1, 2, 3].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
              </select>
              <button
                onClick={() => { if (enrollCitizenId) { onSchoolEnroll(enrollCitizenId, enrollYear); setEnrollCitizenId(""); } }}
                disabled={!enrollCitizenId}
                className={btnPrimary}
              ><GraduationCap size={13} /> Inscrire</button>
            </div>
          </div>

          {/* List by year */}
          {[1, 2, 3].map((year) => {
            const yearStudents = enrolledStudents.filter((c) => c.schoolProfile?.year === year);
            if (!yearStudents.length) return null;
            return (
              <div key={year}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 px-1">{YEAR_LABELS[year]} — {yearStudents.length} étudiant(s)</h3>
                {yearStudents.map((student) => {
                  const sp = student.schoolProfile || {};
                  const avg = calcAvg(sp.notes);
                  const isExpanded = expandedStudent === student.id;
                  return (
                    <div key={student.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm mb-2">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-stone-800 text-sm">{student.name}</span>
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold">{YEAR_LABELS[sp.year]}</span>
                            {avg && <span className="text-xs text-stone-500">Moy. <strong>{avg}/20</strong></span>}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Inscrit le {sp.enrolledAt || "?"} · {(sp.notes || []).length} note(s) · {(sp.lifeEvents || []).length} événement(s)
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={sp.year}
                            onChange={(e) => onSchoolPromote(student.id, Number(e.target.value))}
                            className="p-1 border border-amber-200 rounded-lg text-xs bg-white"
                          >
                            {[1, 2, 3].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
                          </select>
                          <button
                            onClick={() => { if (window.confirm(`Désinscrire ${student.name} ?`)) onSchoolUnenroll(student.id); }}
                            className="text-red-500 hover:text-red-700 text-[10px] border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors"
                          >Désinscrire</button>
                          <button
                            onClick={() => { setExpandedStudent(isExpanded ? null : student.id); setExpandedStudentTab("notes"); }}
                            className="p-1 text-stone-400 hover:text-stone-600"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="border-t border-amber-100 bg-white/60 px-4 py-3">
                          <div className="flex gap-2 mb-3">
                            {["notes", "vie_scolaire"].map((t) => (
                              <button
                                key={t}
                                onClick={() => setExpandedStudentTab(t)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                                  expandedStudentTab === t ? "bg-indigo-900 text-amber-300" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }`}
                              >
                                {t === "notes" ? "Notes" : "Vie Scolaire"}
                              </button>
                            ))}
                          </div>

                          {expandedStudentTab === "notes" && (
                            <div className="space-y-1.5">
                              {(sp.notes || []).length === 0 && <p className="text-xs text-stone-400 italic">Aucune note.</p>}
                              {(sp.notes || []).map((note) => (
                                <div key={note.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-xs border border-amber-100">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-indigo-800">{getSubjectName(note.subjectId)}</span>
                                    <span className="font-mono font-bold text-stone-700">{note.value}/20</span>
                                    {note.comment && <span className="text-stone-500 italic">{note.comment}</span>}
                                    <span className="text-stone-400 text-[10px]">{note.date} · {note.teacherName || getCitizenName(note.teacherId)}</span>
                                  </div>
                                  <button onClick={() => onSchoolDeleteNote(student.id, note.id)} className={btnDanger}><Trash2 size={12} /></button>
                                </div>
                              ))}
                              <div className="flex gap-2 mt-2 pt-2 border-t border-amber-100 flex-wrap">
                                <select className="p-1.5 border border-amber-200 rounded-lg text-xs flex-1 min-w-[120px] bg-white" value={noteSubjectId} onChange={(e) => setNoteSubjectId(e.target.value)}>
                                  <option value="">Matière…</option>
                                  {(school.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                                </select>
                                <input className="w-16 p-1.5 border border-amber-200 rounded-lg text-xs font-mono bg-white" type="number" min={0} max={20} placeholder="/20" value={noteValue} onChange={(e) => setNoteValue(e.target.value)} />
                                <input className="flex-1 p-1.5 border border-amber-200 rounded-lg text-xs min-w-[100px] bg-white" placeholder="Commentaire" value={noteComment} onChange={(e) => setNoteComment(e.target.value)} />
                                <button
                                  onClick={() => {
                                    if (!noteSubjectId || noteValue === "") return;
                                    const subj = (school.subjects || []).find((s) => s.id === noteSubjectId);
                                    onSchoolAddNote(student.id, {
                                      subjectId: noteSubjectId,
                                      subjectName: subj?.name || noteSubjectId,
                                      value: Number(noteValue),
                                      comment: noteComment,
                                      date: new Date().toLocaleDateString("fr-FR"),
                                      teacherId: session?.id || "",
                                      teacherName: session?.name || "DCP",
                                    });
                                    setNoteSubjectId(""); setNoteValue(""); setNoteComment("");
                                  }}
                                  disabled={!noteSubjectId || noteValue === ""}
                                  className={btnPrimary}
                                >Ajouter</button>
                              </div>
                            </div>
                          )}

                          {expandedStudentTab === "vie_scolaire" && (
                            <div className="space-y-1.5">
                              {(sp.lifeEvents || []).length === 0 && <p className="text-xs text-stone-400 italic">Aucun événement.</p>}
                              {(sp.lifeEvents || []).map((evt) => {
                                const typeInfo = SCHOOL_LIFE_EVENT_TYPES[evt.type] || SCHOOL_LIFE_EVENT_TYPES.retard;
                                return (
                                  <div key={evt.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border ${typeInfo.bg} ${typeInfo.border}`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-bold uppercase text-[10px] ${typeInfo.text}`}>{typeInfo.label}</span>
                                      <span className="text-stone-700">{evt.description}</span>
                                      <span className="text-stone-400 text-[10px]">{evt.date} · {evt.authorName}</span>
                                    </div>
                                    <button onClick={() => onSchoolDeleteLifeEvent(student.id, evt.id)} className={btnDanger}><Trash2 size={12} /></button>
                                  </div>
                                );
                              })}
                              <div className="flex gap-2 mt-2 pt-2 border-t border-amber-100 flex-wrap">
                                <select className="p-1.5 border border-amber-200 rounded-lg text-xs bg-white" value={lifeEventType} onChange={(e) => setLifeEventType(e.target.value)}>
                                  {Object.entries(SCHOOL_LIFE_EVENT_TYPES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                  ))}
                                </select>
                                <input className="flex-1 p-1.5 border border-amber-200 rounded-lg text-xs min-w-[150px] bg-white" placeholder="Description…" value={lifeEventDesc} onChange={(e) => setLifeEventDesc(e.target.value)} />
                                <button
                                  onClick={() => {
                                    if (!lifeEventDesc.trim()) return;
                                    onSchoolAddLifeEvent(student.id, {
                                      type: lifeEventType,
                                      description: lifeEventDesc,
                                      date: new Date().toLocaleDateString("fr-FR"),
                                      authorId: session?.id || "",
                                      authorName: session?.name || "DCP",
                                    });
                                    setLifeEventDesc("");
                                  }}
                                  disabled={!lifeEventDesc.trim()}
                                  className={btnPrimary}
                                >Ajouter</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {enrolledStudents.length === 0 && (
            <div className="text-center py-12 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun étudiant inscrit pour l'instant.</p>
            </div>
          )}
        </div>
      )}

      {/* ── PERSONNEL ────────────────────────────────────────────────────── */}
      {activeTab === "personnel" && (
        <div className="space-y-2">
          {SCHOOL_STAFF_ROLES.map((role) => {
            const assigned = (school.staff || []).filter((m) => m.role === role.id);
            return (
              <div key={role.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-amber-100">
                  <span className="text-xl">{role.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-stone-800">{role.label}</p>
                    <p className="text-[10px] text-stone-400">{role.description}</p>
                  </div>
                  {assigned.length > 0 && (
                    <span className="text-[10px] text-indigo-600 font-semibold">{assigned.length} assigné(s)</span>
                  )}
                </div>
                <div className="px-4 py-3">
                  {assigned.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {assigned.map((m) => (
                        <span key={m.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800">
                          {m.citizenName}
                          <button
                            onClick={() => handleSave({ staff: (school.staff || []).filter((s) => s.id !== m.id) })}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          ><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <UserSearchSelect
                    users={citizens.filter((c) => !assigned.some((m) => m.citizenId === c.id))}
                    value={null}
                    onSelect={(selectedId) => {
                      if (!selectedId) return;
                      const citizen = citizens.find((c) => c.id === selectedId);
                      if (!citizen) return;
                      const member = { id: `staff_${Date.now()}`, role: role.id, citizenId: citizen.id, citizenName: citizen.name, assignedAt: new Date().toLocaleDateString("fr-FR") };
                      handleSave({ staff: [...(school.staff || []), member] });
                    }}
                    placeholder={`Assigner un(e) ${role.label.toLowerCase()}…`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CLUBS ────────────────────────────────────────────────────────── */}
      {activeTab === "clubs" && (
        <div className="space-y-2">
          {(school.clubs || []).map((club) => (
            <div key={club.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-amber-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xl flex-shrink-0">
                  {club.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-stone-800 text-sm">{club.name}</div>
                  <p className="text-xs text-stone-500">{club.description}</p>
                </div>
                <button onClick={() => handleSave({ clubs: (school.clubs || []).filter((c) => c.id !== club.id) })} className={btnDanger}><Trash2 size={14} /></button>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-2">{(club.members || []).length} membre(s)</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(club.members || []).map((m) => (
                    <span key={m.id} className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 text-xs text-indigo-700 font-semibold">
                      {m.name}
                      <button
                        onClick={() => handleSave({ clubs: (school.clubs || []).map((c) => c.id === club.id ? { ...c, members: c.members.filter((mb) => mb.id !== m.id) } : c) })}
                        className="text-stone-400 hover:text-red-500 ml-0.5"
                      ><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <UserSearchSelect
                  users={enrolledStudents.filter((s) => !(club.members || []).some((m) => m.id === s.id))}
                  value={null}
                  onSelect={(selectedId) => {
                    if (!selectedId) return;
                    const citizen = citizens.find((c) => c.id === selectedId);
                    if (!citizen) return;
                    handleSave({ clubs: (school.clubs || []).map((c) => c.id === club.id ? { ...c, members: [...(c.members || []), { id: citizen.id, name: citizen.name }] } : c) });
                  }}
                  placeholder="Ajouter un élève…"
                />
              </div>
            </div>
          ))}

          {showNewClub ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wide">⚜️ Nouveau club</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input className="w-12 p-1.5 border border-amber-200 rounded-lg text-sm text-center bg-white" placeholder="🏆" value={newClubIcon} onChange={(e) => setNewClubIcon(e.target.value)} />
                  <input className="flex-1 p-1.5 border border-amber-200 rounded-lg text-sm bg-white" placeholder="Nom du club" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} />
                </div>
                <textarea className={inputCls} rows={2} placeholder="Description" value={newClubDesc} onChange={(e) => setNewClubDesc(e.target.value)} />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!newClubName.trim()) return;
                      const club = { id: `club_${Date.now()}`, name: newClubName.trim(), description: newClubDesc, icon: newClubIcon, leaderId: null, leaderName: null, members: [] };
                      handleSave({ clubs: [...(school.clubs || []), club] });
                      setNewClubName(""); setNewClubDesc(""); setNewClubIcon("🏆"); setShowNewClub(false);
                    }}
                    className={btnPrimary}
                  ><Plus size={12} /> Créer</button>
                  <button onClick={() => setShowNewClub(false)} className="text-stone-400 px-3 py-1.5 rounded-lg text-xs">Annuler</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewClub(true)}
              className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-indigo-400 hover:text-indigo-700 text-sm flex items-center justify-center gap-2 transition-colors bg-amber-50/50"
            >
              <Plus size={16} /> Créer un club
            </button>
          )}
        </div>
      )}

      {/* ── ANNONCES ─────────────────────────────────────────────────────── */}
      {activeTab === "annonces" && (
        <div className="space-y-2">
          {(school.announcements || []).length === 0 && (
            <div className="text-center py-10 text-stone-400 bg-amber-50 border border-amber-100 rounded-xl">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune annonce.</p>
            </div>
          )}
          {(school.announcements || []).slice().reverse().map((ann) => (
            <div key={ann.id} className={`rounded-xl border overflow-hidden shadow-sm ${ann.important ? "border-red-300" : "border-amber-200"}`}>
              {ann.important && (
                <div className="bg-red-700 px-4 py-1.5">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">⚠️ Proclamation Urgente</span>
                </div>
              )}
              <div className={`flex items-start gap-3 px-4 py-4 ${ann.important ? "bg-red-50" : "bg-amber-50/80"}`}>
                <div className="flex-1">
                  <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                  <div className="mt-3 pt-2 border-t border-amber-100 flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">⚜️ {ann.authorName}</span>
                    <span className="text-[10px] text-stone-400 ml-auto">{ann.date}</span>
                  </div>
                </div>
                <button onClick={() => handleSave({ announcements: (school.announcements || []).filter((a) => a.id !== ann.id) })} className={`${btnDanger} flex-shrink-0`}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}

          {showNewAnnonce ? (
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wide">⚜️ Nouvelle proclamation</p>
              <div className="space-y-2">
                <textarea className={inputCls} rows={4} placeholder="Rédigez l'annonce…" value={annonceContent} onChange={(e) => setAnnonceContent(e.target.value)} />
                <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                  <input type="checkbox" checked={annonceImportant} onChange={(e) => setAnnonceImportant(e.target.checked)} />
                  Marquer comme urgente
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!annonceContent.trim()) return;
                      const ann = { id: Date.now(), content: annonceContent.trim(), date: new Date().toLocaleDateString("fr-FR"), authorId: session?.id || "", authorName: session?.name || "DCP", important: annonceImportant };
                      handleSave({ announcements: [...(school.announcements || []), ann] });
                      setAnnonceContent(""); setAnnonceImportant(false); setShowNewAnnonce(false);
                    }}
                    className={btnPrimary}
                  ><Plus size={12} /> Publier</button>
                  <button onClick={() => setShowNewAnnonce(false)} className="text-stone-400 px-3 py-1.5 rounded-lg text-xs">Annuler</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewAnnonce(true)}
              className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-indigo-400 hover:text-indigo-700 text-sm flex items-center justify-center gap-2 transition-colors bg-amber-50/50"
            >
              <Plus size={16} /> Rédiger une proclamation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
