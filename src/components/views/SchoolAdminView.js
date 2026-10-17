import React, { useState } from "react";
import {
  Plus, Trash2, X, Save, GraduationCap, BookOpen, Calendar, Users,
  Star, Bell, Pencil, ChevronDown, ChevronUp,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";
import { DEFAULT_SCHOOL, SCHOOL_LIFE_EVENT_TYPES, SCHOOL_DAYS, SCHOOL_TIME_SLOTS } from "../../lib/constants";

const SUBJECT_COLORS = [
  "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2",
  "#64748B", "#0D9488", "#9333EA", "#EA580C", "#BE185D",
];

const YEAR_LABELS = { 1: "1re année", 2: "2e année", 3: "3e année" };

export default function SchoolAdminView({
  school: schoolProp,
  citizens = [],
  session,
  roleInfo,
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
  const [slotNotes] = useState("");
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
  const [addClubMemberId] = useState({});

  // Annonces form
  const [showNewAnnonce, setShowNewAnnonce] = useState(false);
  const [annonceContent, setAnnonceContent] = useState("");
  const [annonceImportant, setAnnonceImportant] = useState(false);

  const enrolledStudents = citizens.filter((c) => c.schoolProfile?.enrolled);

  const handleSave = (updates) => onUpdateSchool({ ...school, ...updates });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getSubjectName = (id) => (school.subjects || []).find((s) => s.id === id)?.name || id;
  const getCitizenName = (id) => (citizens || []).find((c) => c.id === id)?.name || id;

  const calcAvg = (notes) => {
    const nums = (notes || []).map((n) => Number(n.value)).filter((v) => !isNaN(v));
    if (!nums.length) return null;
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
  };

  const TABS = [
    { id: "matieres",  label: "Matières",    icon: BookOpen },
    { id: "edt",       label: "EDT",          icon: Calendar },
    { id: "eleves",    label: "Élèves",       icon: Users },
    { id: "clubs",     label: "Clubs",        icon: Star },
    { id: "annonces",  label: "Annonces",     icon: Bell },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-stone-800">{school.name || "Académie Impériale"}</h1>
          <p className="text-xs text-stone-500">{school.motto || "Administration DCP"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${school.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {school.active ? "Ouverte" : "Fermée"}
          </span>
          <button onClick={() => handleSave({ active: !school.active })} className="text-xs text-stone-500 underline hover:text-stone-700">
            {school.active ? "Fermer" : "Ouvrir"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-stone-200 pb-0">
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
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── MATIÈRES ─────────────────────────────────────────────────────── */}
      {activeTab === "matieres" && (
        <div className="space-y-3">
          {(school.subjects || []).map((subj) => (
            <Card key={subj.id} className="border border-stone-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: subj.color + "22" }}>
                  {subj.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {editingSubjectId === subj.id ? (
                    <div className="space-y-2">
                      <input className="w-full p-1.5 border rounded text-sm font-bold" value={editSubjectName} onChange={(e) => setEditSubjectName(e.target.value)} />
                      <textarea className="w-full p-1.5 border rounded text-xs" rows={2} value={editSubjectDesc} onChange={(e) => setEditSubjectDesc(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => {
                          handleSave({ subjects: (school.subjects || []).map((s) => s.id === subj.id ? { ...s, name: editSubjectName || s.name, description: editSubjectDesc } : s) });
                          setEditingSubjectId(null);
                        }} className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold"><Save size={11} /> Enregistrer</button>
                        <button onClick={() => setEditingSubjectId(null)} className="text-stone-400 hover:text-stone-600 px-2 py-1 rounded text-xs">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 text-sm">{subj.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: subj.color + "22", color: subj.color }}>
                          {subj.year === "all" ? "Toutes années" : YEAR_LABELS[subj.year]}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{subj.description}</p>
                      {subj.teacherId && (
                        <p className="text-xs text-indigo-600 mt-1">Professeur : <strong>{subj.teacherName || getCitizenName(subj.teacherId)}</strong></p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingSubjectId(subj.id); setEditSubjectName(subj.name); setEditSubjectDesc(subj.description || ""); }} className="text-stone-400 hover:text-stone-600 p-1"><Pencil size={13} /></button>
                  <button onClick={() => handleSave({ subjects: (school.subjects || []).filter((s) => s.id !== subj.id) })} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Assign professor */}
              {editingSubjectId !== subj.id && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-bold uppercase text-stone-400 mb-1.5">Attribuer un professeur</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <UserSearchSelect
                        users={citizens}
                        value={subj.teacherId || null}
                        onSelect={(selectedId) => {
                          if (!selectedId) return;
                          const citizen = citizens.find((c) => c.id === selectedId);
                          if (!citizen) return;
                          handleSave({ subjects: (school.subjects || []).map((s) => s.id === subj.id ? { ...s, teacherId: citizen.id, teacherName: citizen.name } : s) });
                        }}
                        placeholder="Chercher un citoyen..."
                      />
                    </div>
                    {subj.teacherId && (
                      <button onClick={() => handleSave({ subjects: (school.subjects || []).map((s) => s.id === subj.id ? { ...s, teacherId: null, teacherName: null } : s) })} className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50">Retirer</button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Add subject */}
          {showNewSubject ? (
            <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50">
              <p className="text-xs font-bold text-indigo-700 mb-3 uppercase">Nouvelle matière</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input className="w-12 p-1.5 border rounded text-sm text-center" placeholder="📜" value={newSubjectIcon} onChange={(e) => setNewSubjectIcon(e.target.value)} />
                  <input className="flex-1 p-1.5 border rounded text-sm" placeholder="Nom de la matière" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
                </div>
                <textarea className="w-full p-1.5 border rounded text-xs" rows={2} placeholder="Description" value={newSubjectDesc} onChange={(e) => setNewSubjectDesc(e.target.value)} />
                <div className="flex gap-2 items-center">
                  <select className="p-1.5 border rounded text-xs" value={newSubjectYear} onChange={(e) => setNewSubjectYear(e.target.value === "all" ? "all" : Number(e.target.value))}>
                    <option value="all">Toutes années</option>
                    <option value={1}>1re année</option>
                    <option value={2}>2e année</option>
                    <option value={3}>3e année</option>
                  </select>
                  <div className="flex gap-1 ml-2">
                    {SUBJECT_COLORS.map((c) => (
                      <button key={c} onClick={() => setNewSubjectColor(c)} className={`w-5 h-5 rounded-full border-2 ${newSubjectColor === c ? "border-stone-800" : "border-transparent"}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => {
                    if (!newSubjectName.trim()) return;
                    const subj = { id: `subj_${Date.now()}`, name: newSubjectName.trim(), description: newSubjectDesc, icon: newSubjectIcon, year: newSubjectYear, teacherId: null, teacherName: null, color: newSubjectColor };
                    handleSave({ subjects: [...(school.subjects || []), subj] });
                    setNewSubjectName(""); setNewSubjectDesc(""); setNewSubjectIcon("📜"); setNewSubjectYear("all"); setShowNewSubject(false);
                  }} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-bold"><Plus size={12} /> Créer</button>
                  <button onClick={() => setShowNewSubject(false)} className="text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded text-xs">Annuler</button>
                </div>
              </div>
            </Card>
          ) : (
            <button onClick={() => setShowNewSubject(true)} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors">
              <Plus size={16} /> Ajouter une matière
            </button>
          )}
        </div>
      )}

      {/* ── EDT ──────────────────────────────────────────────────────────── */}
      {activeTab === "edt" && (
        <div className="space-y-4">
          {/* Year filter */}
          <div className="flex gap-2">
            {[1, 2, 3].map((y) => (
              <button key={y} onClick={() => setEdtYearFilter(y)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${edtYearFilter === y ? "bg-indigo-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-indigo-100"}`}>
                {YEAR_LABELS[y]}
              </button>
            ))}
          </div>

          {/* Weekly grid */}
          <div className="grid grid-cols-6 gap-2">
            {SCHOOL_DAYS.map((day) => {
              const daySlots = (school.schedule || []).filter((s) => s.day === day && (s.year === edtYearFilter || s.year === "all"));
              return (
                <div key={day} className="min-h-[120px]">
                  <div className="text-[10px] font-bold uppercase text-stone-500 mb-2 text-center">{day}</div>
                  {daySlots.length === 0 && <div className="text-[10px] text-stone-300 text-center mt-4">—</div>}
                  {daySlots.map((slot) => {
                    const subj = (school.subjects || []).find((s) => s.id === slot.subjectId);
                    return (
                      <div key={slot.id} className="rounded-lg p-2 mb-1.5 text-[10px] relative" style={{ background: (subj?.color || "#64748B") + "20", borderLeft: `3px solid ${subj?.color || "#64748B"}` }}>
                        <div className="font-bold" style={{ color: subj?.color || "#64748B" }}>{subj?.icon} {subj?.name || slot.subjectId}</div>
                        <div className="text-stone-500">{slot.timeSlot}</div>
                        {slot.room && <div className="text-stone-400 italic">{slot.room}</div>}
                        <div className="text-stone-400">{(slot.enrolledStudents || []).length} élève(s)</div>
                        <button onClick={() => handleSave({ schedule: (school.schedule || []).filter((s) => s.id !== slot.id) })} className="absolute top-1 right-1 text-stone-300 hover:text-red-500 opacity-0 hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Add slot form */}
          {showNewSlot ? (
            <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50">
              <p className="text-xs font-bold text-indigo-700 mb-3 uppercase">Nouveau créneau</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Matière</label>
                  <select className="w-full p-1.5 border rounded text-xs" value={slotSubjectId} onChange={(e) => setSlotSubjectId(e.target.value)}>
                    <option value="">— Choisir —</option>
                    {(school.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Année</label>
                  <select className="w-full p-1.5 border rounded text-xs" value={slotYear} onChange={(e) => setSlotYear(Number(e.target.value))}>
                    {[1, 2, 3].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Jour</label>
                  <select className="w-full p-1.5 border rounded text-xs" value={slotDay} onChange={(e) => setSlotDay(e.target.value)}>
                    {SCHOOL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 block mb-1">Créneau</label>
                  <select className="w-full p-1.5 border rounded text-xs" value={slotTime} onChange={(e) => setSlotTime(e.target.value)}>
                    {SCHOOL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-stone-500 block mb-1">Salle (optionnel)</label>
                  <input className="w-full p-1.5 border rounded text-xs" value={slotRoom} onChange={(e) => setSlotRoom(e.target.value)} placeholder="Ex: Salle des Lettres" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => {
                  if (!slotSubjectId) return;
                  const subj = (school.subjects || []).find((s) => s.id === slotSubjectId);
                  const slot = { id: `slot_${Date.now()}`, subjectId: slotSubjectId, subjectName: subj?.name || "", day: slotDay, timeSlot: slotTime, room: slotRoom, year: slotYear, enrolledStudents: [] };
                  handleSave({ schedule: [...(school.schedule || []), slot] });
                  setSlotSubjectId(""); setSlotRoom(""); setShowNewSlot(false);
                }} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-bold"><Plus size={12} /> Créer</button>
                <button onClick={() => setShowNewSlot(false)} className="text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded text-xs">Annuler</button>
              </div>
            </Card>
          ) : (
            <button onClick={() => setShowNewSlot(true)} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors">
              <Plus size={16} /> Ajouter un créneau
            </button>
          )}
        </div>
      )}

      {/* ── ÉLÈVES ───────────────────────────────────────────────────────── */}
      {activeTab === "eleves" && (
        <div className="space-y-4">
          {/* Inscrire */}
          <Card title="Inscrire un étudiant" icon={Plus}>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <UserSearchSelect users={citizens.filter((c) => !c.schoolProfile?.enrolled)} value={enrollCitizenId} onSelect={(s) => setEnrollCitizenId(s?.id || "")} placeholder="Chercher un citoyen..." />
              </div>
              <select className="p-2 border rounded text-xs" value={enrollYear} onChange={(e) => setEnrollYear(Number(e.target.value))}>
                {[1, 2, 3].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
              </select>
              <button onClick={() => { if (enrollCitizenId) { onSchoolEnroll(enrollCitizenId, enrollYear); setEnrollCitizenId(""); } }} disabled={!enrollCitizenId} className="bg-indigo-600 text-white px-4 py-2 rounded text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-1"><GraduationCap size={13} /> Inscrire</button>
            </div>
          </Card>

          {/* Liste par année */}
          {[1, 2, 3].map((year) => {
            const yearStudents = enrolledStudents.filter((c) => c.schoolProfile?.year === year);
            if (!yearStudents.length) return null;
            return (
              <div key={year}>
                <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">{YEAR_LABELS[year]} — {yearStudents.length} étudiant(s)</h3>
                {yearStudents.map((student) => {
                  const sp = student.schoolProfile || {};
                  const avg = calcAvg(sp.notes);
                  const isExpanded = expandedStudent === student.id;
                  return (
                    <Card key={student.id} className="mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800 text-sm">{student.name}</span>
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold">{YEAR_LABELS[sp.year]}</span>
                            {avg && <span className="text-xs text-stone-500">Moy. <strong>{avg}/20</strong></span>}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Inscrit le {sp.enrolledAt || "?"} · {(sp.notes || []).length} note(s) · {(sp.lifeEvents || []).length} événement(s)
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <select value={sp.year} onChange={(e) => onSchoolPromote(student.id, Number(e.target.value))} className="p-1 border rounded text-xs text-stone-600 bg-white">
                            {[1, 2, 3].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
                          </select>
                          <button onClick={() => { if (window.confirm(`Désinscrire ${student.name} ?`)) onSchoolUnenroll(student.id); }} className="text-red-400 hover:text-red-600 p-1 text-[10px] border border-red-200 rounded">Désinscrire</button>
                          <button onClick={() => { setExpandedStudent(isExpanded ? null : student.id); setExpandedStudentTab("notes"); }} className="p-1 text-stone-400 hover:text-stone-600">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                          <div className="flex gap-2 mb-3">
                            {["notes", "vie_scolaire"].map((t) => (
                              <button key={t} onClick={() => setExpandedStudentTab(t)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${expandedStudentTab === t ? "bg-indigo-600 text-white" : "bg-stone-100 text-stone-500"}`}>
                                {t === "notes" ? "Notes" : "Vie Scolaire"}
                              </button>
                            ))}
                          </div>

                          {expandedStudentTab === "notes" && (
                            <div className="space-y-2">
                              {(sp.notes || []).length === 0 && <p className="text-xs text-stone-400 italic">Aucune note.</p>}
                              {(sp.notes || []).map((note) => (
                                <div key={note.id} className="flex items-center justify-between bg-stone-50 rounded px-3 py-2 text-xs border border-stone-100">
                                  <div>
                                    <span className="font-bold text-indigo-700">{getSubjectName(note.subjectId)}</span>
                                    <span className="mx-2 font-mono font-bold text-stone-700">{note.value}/20</span>
                                    {note.comment && <span className="text-stone-500 italic">{note.comment}</span>}
                                    <span className="text-stone-400 ml-2 text-[10px]">{note.date} · {note.teacherName || getCitizenName(note.teacherId)}</span>
                                  </div>
                                  <button onClick={() => onSchoolDeleteNote(student.id, note.id)} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                              ))}
                              {/* Add note form */}
                              <div className="flex gap-2 mt-2 pt-2 border-t border-stone-100 flex-wrap">
                                <select className="p-1.5 border rounded text-xs flex-1 min-w-[120px]" value={noteSubjectId} onChange={(e) => setNoteSubjectId(e.target.value)}>
                                  <option value="">Matière…</option>
                                  {(school.subjects || []).map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                                </select>
                                <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" min={0} max={20} placeholder="/20" value={noteValue} onChange={(e) => setNoteValue(e.target.value)} />
                                <input className="flex-1 p-1.5 border rounded text-xs min-w-[100px]" placeholder="Commentaire" value={noteComment} onChange={(e) => setNoteComment(e.target.value)} />
                                <button onClick={() => {
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
                                }} disabled={!noteSubjectId || noteValue === ""} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">Ajouter</button>
                              </div>
                            </div>
                          )}

                          {expandedStudentTab === "vie_scolaire" && (
                            <div className="space-y-2">
                              {(sp.lifeEvents || []).length === 0 && <p className="text-xs text-stone-400 italic">Aucun événement.</p>}
                              {(sp.lifeEvents || []).map((evt) => {
                                const typeInfo = SCHOOL_LIFE_EVENT_TYPES[evt.type] || SCHOOL_LIFE_EVENT_TYPES.retard;
                                return (
                                  <div key={evt.id} className={`flex items-center justify-between rounded px-3 py-2 text-xs border ${typeInfo.bg} ${typeInfo.border}`}>
                                    <div>
                                      <span className={`font-bold uppercase text-[10px] ${typeInfo.text}`}>{typeInfo.label}</span>
                                      <span className="text-stone-700 mx-2">{evt.description}</span>
                                      <span className="text-stone-400 text-[10px]">{evt.date} · {evt.authorName}</span>
                                    </div>
                                    <button onClick={() => onSchoolDeleteLifeEvent(student.id, evt.id)} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                                  </div>
                                );
                              })}
                              {/* Add life event form */}
                              <div className="flex gap-2 mt-2 pt-2 border-t border-stone-100 flex-wrap">
                                <select className="p-1.5 border rounded text-xs" value={lifeEventType} onChange={(e) => setLifeEventType(e.target.value)}>
                                  {Object.entries(SCHOOL_LIFE_EVENT_TYPES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                  ))}
                                </select>
                                <input className="flex-1 p-1.5 border rounded text-xs min-w-[150px]" placeholder="Description…" value={lifeEventDesc} onChange={(e) => setLifeEventDesc(e.target.value)} />
                                <button onClick={() => {
                                  if (!lifeEventDesc.trim()) return;
                                  onSchoolAddLifeEvent(student.id, {
                                    type: lifeEventType,
                                    description: lifeEventDesc,
                                    date: new Date().toLocaleDateString("fr-FR"),
                                    authorId: session?.id || "",
                                    authorName: session?.name || "DCP",
                                  });
                                  setLifeEventDesc("");
                                }} disabled={!lifeEventDesc.trim()} className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">Ajouter</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            );
          })}

          {enrolledStudents.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun étudiant inscrit pour l'instant.</p>
            </div>
          )}
        </div>
      )}

      {/* ── CLUBS ────────────────────────────────────────────────────────── */}
      {activeTab === "clubs" && (
        <div className="space-y-3">
          {(school.clubs || []).map((club) => (
            <Card key={club.id} className="border border-stone-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{club.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-stone-800 text-sm">{club.name}</div>
                  <p className="text-xs text-stone-500">{club.description}</p>
                </div>
                <button onClick={() => handleSave({ clubs: (school.clubs || []).filter((c) => c.id !== club.id) })} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
              </div>
              {/* Members */}
              <div className="mt-2 pt-2 border-t border-stone-100">
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-1.5">{(club.members || []).length} membre(s)</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(club.members || []).map((m) => (
                    <span key={m.id} className="flex items-center gap-1 bg-stone-100 rounded-full px-2 py-0.5 text-xs">
                      {m.name}
                      <button onClick={() => handleSave({ clubs: (school.clubs || []).map((c) => c.id === club.id ? { ...c, members: c.members.filter((mb) => mb.id !== m.id) } : c) })} className="text-stone-400 hover:text-red-500 ml-0.5"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <UserSearchSelect
                      users={enrolledStudents.filter((s) => !(club.members || []).some((m) => m.id === s.id))}
                      value={addClubMemberId[club.id] || ""}
                      onSelect={(selected) => {
                        if (!selected) return;
                        handleSave({ clubs: (school.clubs || []).map((c) => c.id === club.id ? { ...c, members: [...(c.members || []), { id: selected.id, name: selected.name }] } : c) });
                      }}
                      placeholder="Ajouter un élève…"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {showNewClub ? (
            <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50">
              <p className="text-xs font-bold text-indigo-700 mb-3 uppercase">Nouveau club</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input className="w-12 p-1.5 border rounded text-sm text-center" placeholder="🏆" value={newClubIcon} onChange={(e) => setNewClubIcon(e.target.value)} />
                  <input className="flex-1 p-1.5 border rounded text-sm" placeholder="Nom du club" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} />
                </div>
                <textarea className="w-full p-1.5 border rounded text-xs" rows={2} placeholder="Description" value={newClubDesc} onChange={(e) => setNewClubDesc(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (!newClubName.trim()) return;
                    const club = { id: `club_${Date.now()}`, name: newClubName.trim(), description: newClubDesc, icon: newClubIcon, leaderId: null, leaderName: null, members: [] };
                    handleSave({ clubs: [...(school.clubs || []), club] });
                    setNewClubName(""); setNewClubDesc(""); setNewClubIcon("🏆"); setShowNewClub(false);
                  }} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-bold"><Plus size={12} /> Créer</button>
                  <button onClick={() => setShowNewClub(false)} className="text-stone-400 px-3 py-1.5 rounded text-xs">Annuler</button>
                </div>
              </div>
            </Card>
          ) : (
            <button onClick={() => setShowNewClub(true)} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors">
              <Plus size={16} /> Créer un club
            </button>
          )}
        </div>
      )}

      {/* ── ANNONCES ─────────────────────────────────────────────────────── */}
      {activeTab === "annonces" && (
        <div className="space-y-3">
          {(school.announcements || []).length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">Aucune annonce.</div>
          )}
          {(school.announcements || []).slice().reverse().map((ann) => (
            <Card key={ann.id} className={`border ${ann.important ? "border-red-200 bg-red-50" : "border-stone-200"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {ann.important && <span className="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold uppercase mb-1">Urgent</span>}
                  <p className="text-sm text-stone-800 whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{ann.date} · {ann.authorName}</p>
                </div>
                <button onClick={() => handleSave({ announcements: (school.announcements || []).filter((a) => a.id !== ann.id) })} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"><Trash2 size={13} /></button>
              </div>
            </Card>
          ))}

          {showNewAnnonce ? (
            <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50">
              <p className="text-xs font-bold text-indigo-700 mb-3 uppercase">Nouvelle annonce</p>
              <div className="space-y-2">
                <textarea className="w-full p-2 border rounded text-sm" rows={4} placeholder="Rédigez l'annonce…" value={annonceContent} onChange={(e) => setAnnonceContent(e.target.value)} />
                <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                  <input type="checkbox" checked={annonceImportant} onChange={(e) => setAnnonceImportant(e.target.checked)} />
                  Marquer comme urgent
                </label>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (!annonceContent.trim()) return;
                    const ann = { id: Date.now(), content: annonceContent.trim(), date: new Date().toLocaleDateString("fr-FR"), authorId: session?.id || "", authorName: session?.name || "DCP", important: annonceImportant };
                    handleSave({ announcements: [...(school.announcements || []), ann] });
                    setAnnonceContent(""); setAnnonceImportant(false); setShowNewAnnonce(false);
                  }} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-bold"><Plus size={12} /> Publier</button>
                  <button onClick={() => setShowNewAnnonce(false)} className="text-stone-400 px-3 py-1.5 rounded text-xs">Annuler</button>
                </div>
              </div>
            </Card>
          ) : (
            <button onClick={() => setShowNewAnnonce(true)} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 hover:border-indigo-400 hover:text-indigo-600 text-sm flex items-center justify-center gap-2 transition-colors">
              <Plus size={16} /> Rédiger une annonce
            </button>
          )}
        </div>
      )}
    </div>
  );
}
