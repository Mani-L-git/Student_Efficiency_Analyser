import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const GRADE_COLOR = {
  O: "#16a34a", "A+": "#2563eb", A: "#0891b2",
  "B+": "#7c3aed", B: "#d97706", C: "#ea580c", F: "#dc2626",
};

const GRADE_REFERENCE = [
  { range: "91 – 100", grade: "O",  pts: 10 },
  { range: "81 – 90",  grade: "A+", pts: 9  },
  { range: "71 – 80",  grade: "A",  pts: 8  },
  { range: "61 – 70",  grade: "B+", pts: 7  },
  { range: "56 – 60",  grade: "B",  pts: 6  },
  { range: "51 – 55",  grade: "C",  pts: 5  },
  { range: "≤ 50",     grade: "F",  pts: 0  },
];

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
function StudentDashboard() {
  const navigate  = useNavigate();
  const studentId = localStorage.getItem("userId");
  const token     = localStorage.getItem("token");

  // ── Data state ──────────────────────────
  const [studentName,      setStudentName]      = useState("");
  const [cgpa,             setCgpa]             = useState("0.00");
  const [semesters,        setSemesters]        = useState([]);
  const [attendance,       setAttendance]       = useState([]);
  const [announcements,    setAnnouncements]    = useState([]);
  const [replies,          setReplies]          = useState({});   // { annId: [reply, …] }

  // ── UI state ────────────────────────────
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [activeTab,        setActiveTab]        = useState("Dashboard"); // Dashboard | Announcements
  const [loading,          setLoading]          = useState(true);
  const [showGradeRef,     setShowGradeRef]     = useState(false);

  // ── Reply state ─────────────────────────
  const [replyText,   setReplyText]   = useState({});  // { annId: "text" }
  const [isListening, setIsListening] = useState(null); // annId currently recording

  // ── Efficiency score ─────────────────────
  const [effScore, setEffScore] = useState(null);

  /* ── Auth header helper ─────────────── */
  const authHeader = { Authorization: `Bearer ${token}` };

  /* ─────────────────────────────────────
     FETCH ALL ON MOUNT
  ───────────────────────────────────── */
  useEffect(() => {
    if (!studentId || !token) { navigate("/"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchMarks(),
        fetchStudent(),
        fetchAttendance(),
        fetchAnnouncements(),
        fetchEfficiencyScore(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch marks ────────────────────── */
  const fetchMarks = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/student-marks/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setSemesters(data.semesters || []);
      setCgpa(data.cgpa || "0.00");
      if (data.semesters?.length > 0) setSelectedSemester(data.semesters[0].semester);
    } catch (err) { console.error("Marks error:", err); }
  };

  /* ── Fetch efficiency score ─────────── */
  const fetchEfficiencyScore = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/efficiency/${studentId}`, { headers: authHeader });
      if (!res.ok) return;
      const data = await res.json();
      setEffScore(data);
    } catch (err) { console.error("Efficiency error:", err); }
  };

  /* ── Fetch student info ─────────────── */
  const fetchStudent = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/student/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setStudentName(data?.name || "Student");
    } catch (err) { console.error("Student error:", err); }
  };

  /* ── Fetch attendance ───────────────── */
  const fetchAttendance = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/student-attendance/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Attendance error:", err); }
  };

  /* ── Fetch announcements ────────────── */
  const fetchAnnouncements = async () => {
    try {
      const res  = await fetch("http://localhost:5000/announcements", { headers: authHeader });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAnnouncements(list);
      // fetch replies for each announcement
      for (const ann of list) {
        fetchReplies(ann.id);
      }
    } catch (err) { console.error("Announcements error:", err); }
  };

  /* ── Fetch replies for one announcement */
  const fetchReplies = async (annId) => {
    try {
      const res  = await fetch(`http://localhost:5000/announcement/${annId}/replies`, { headers: authHeader });
      const data = await res.json();
      setReplies(prev => ({ ...prev, [annId]: Array.isArray(data) ? data : [] }));
    } catch (err) { console.error("Replies error:", err); }
  };

  /* ─────────────────────────────────────
     VOICE REPLY (Web Speech API)
  ───────────────────────────────────── */
  const startVoice = (annId) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang        = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(annId);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setReplyText(prev => ({ ...prev, [annId]: transcript }));
      setIsListening(null);
    };
    recognition.onerror = () => { setIsListening(null); };
    recognition.onend   = () => { setIsListening(null); };
    recognition.start();
  };

  /* ── Submit reply ───────────────────── */
  const submitReply = async (annId, isVoice = false) => {
    const text = (replyText[annId] || "").trim();
    if (!text) return;
    try {
      const res = await fetch(`http://localhost:5000/announcement/${annId}/reply`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body:    JSON.stringify({ reply_text: text, is_voice: isVoice }),
      });
      if (!res.ok) return;
      setReplyText(prev => ({ ...prev, [annId]: "" }));
      fetchReplies(annId);
    } catch (err) { console.error("Reply error:", err); }
  };

  /* ─────────────────────────────────────
     HELPERS
  ───────────────────────────────────── */
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const activeSem = semesters.find((s) => s.semester === selectedSemester) || null;

  const overallAttendance = attendance.length > 0
    ? (attendance.reduce((sum, a) => sum + Number(a.attendance_percentage || 0), 0) / attendance.length).toFixed(1)
    : "0.0";

  const sgpaColor = (sgpa) => {
    const v = parseFloat(sgpa);
    if (v >= 8) return "#16a34a";
    if (v >= 6) return "#2563eb";
    if (v >= 5) return "#d97706";
    return "#dc2626";
  };

  /* ─────────────────────────────────────
     LOADING
  ───────────────────────────────────── */
  if (loading) return (
    <div className="loading-container"><h2>Loading Dashboard...</h2></div>
  );

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div className="dashboard-container">

      {/* ══════════════ SIDEBAR ══════════════ */}
      <div className="sidebar">
        <h2>SLEA</h2>

        {/* Nav buttons */}
        <button
          onClick={() => setActiveTab("Dashboard")}
          style={{
            background: activeTab === "Dashboard" ? "#38bdf8" : "#334155",
            marginBottom: "8px",
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveTab("Announcements")}
          style={{
            background: activeTab === "Announcements" ? "#38bdf8" : "#334155",
            marginBottom: "8px",
            position: "relative",
          }}
        >
          📢 Announcements
          {announcements.length > 0 && (
            <span style={{
              position: "absolute", top: "6px", right: "10px",
              background: "#ef4444", color: "#fff",
              fontSize: "11px", borderRadius: "999px",
              padding: "1px 7px", fontWeight: 700,
            }}>
              {announcements.length}
            </span>
          )}
        </button>

        {/* Grade Reference toggle */}
        <button
          onClick={() => setShowGradeRef(p => !p)}
          style={{ background: showGradeRef ? "#7c3aed" : "#334155", marginBottom: "8px" }}
        >
          📋 Grade Reference
        </button>

        <button onClick={handleLogout} style={{ background: "#ef4444", marginTop: "auto" }}>
          Logout
        </button>
      </div>

      {/* ══════════════ MAIN ══════════════ */}
      <div className="main-content">

        {/* ── Grade Reference (collapsible, any tab) ── */}
        {showGradeRef && (
          <div style={{
            background: "rgba(30,41,59,0.85)", border: "1px solid rgba(56,189,248,0.3)",
            borderRadius: "12px", padding: "20px 24px", marginBottom: "24px",
          }}>
            <p style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 600, marginBottom: "14px" }}>
              📊 Grade Reference Chart
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {GRADE_REFERENCE.map(({ range, grade, pts }) => (
                <div key={grade} style={{
                  background: (GRADE_COLOR[grade] || "#64748b") + "18",
                  border: `1px solid ${GRADE_COLOR[grade] || "#64748b"}`,
                  borderRadius: "10px", padding: "10px 16px", textAlign: "center", minWidth: "90px",
                }}>
                  <p style={{ fontWeight: 700, color: GRADE_COLOR[grade], fontSize: "18px" }}>{grade}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{range}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>{pts} pts</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            TAB: ANNOUNCEMENTS
        ════════════════════════════════ */}
        {activeTab === "Announcements" && (
          <div>
            <h1 style={{ marginBottom: "20px" }}>📢 Announcements</h1>

            {announcements.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "16px" }}>No announcements yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} style={{
                  background: "rgba(30,41,59,0.7)", border: "1px solid rgba(56,189,248,0.25)",
                  borderRadius: "12px", padding: "20px 22px", marginBottom: "18px",
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "11px", padding: "2px 10px", borderRadius: "999px",
                      background: "rgba(248,113,113,0.12)", color: "#f87171",
                      border: "1px solid rgba(248,113,113,0.25)", fontWeight: 600,
                    }}>
                      {ann.target === "all" ? "Super Admin" : ann.target + " Admin"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>
                      {ann.created_at ? new Date(ann.created_at).toLocaleString() : ""}
                    </span>
                  </div>

                  {/* Title & message */}
                  <p style={{ fontWeight: 700, fontSize: "16px", color: "#e2e8f0", marginBottom: "6px" }}>
                    {ann.title}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "14px" }}>
                    {ann.message}
                  </p>

                  {/* Existing replies */}
                  {(replies[ann.id] || []).length > 0 && (
                    <div style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: "2px solid rgba(56,189,248,0.3)" }}>
                      {(replies[ann.id] || []).map((r, i) => (
                        <div key={i} style={{
                          background: "rgba(15,23,42,0.5)", borderRadius: "8px",
                          padding: "8px 12px", marginBottom: "6px",
                        }}>
                          <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>
                            {r.user_name || "You"}
                          </span>
                          {r.is_voice === 1 && (
                            <span style={{ fontSize: "10px", color: "#a78bfa", marginLeft: "6px" }}>🎤 voice</span>
                          )}
                          <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "2px" }}>{r.reply_text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply box */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      style={{
                        flex: 1, background: "rgba(15,23,42,0.6)",
                        border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px",
                        padding: "9px 14px", color: "#e2e8f0", fontSize: "13px",
                        outline: "none", fontFamily: "inherit",
                      }}
                      placeholder="Write a reply…"
                      value={replyText[ann.id] || ""}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [ann.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && submitReply(ann.id, false)}
                    />
                    {/* Voice button */}
                    <button
                      onClick={() => startVoice(ann.id)}
                      title="Speak your reply"
                      style={{
                        padding: "9px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                        background: isListening === ann.id
                          ? "rgba(239,68,68,0.4)"
                          : "rgba(56,189,248,0.15)",
                        fontSize: "16px",
                        animation: isListening === ann.id ? "pulse 1s infinite" : "none",
                      }}
                    >
                      🎤
                    </button>
                    {/* Send button */}
                    <button
                      onClick={() => submitReply(ann.id, false)}
                      style={{
                        padding: "9px 18px", borderRadius: "8px", border: "none",
                        background: "#38bdf8", color: "#0f172a",
                        fontWeight: 700, fontSize: "13px", cursor: "pointer",
                      }}
                    >
                      Send
                    </button>
                  </div>

                  {/* Listening indicator */}
                  {isListening === ann.id && (
                    <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                      🎤 Listening… speak now
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ════════════════════════════════
            TAB: DASHBOARD
        ════════════════════════════════ */}
        {activeTab === "Dashboard" && (
          <>
            <h1>Welcome, {studentName} 👋</h1>

            {/* ── Summary cards ── */}
            <div className="summary">
              <div className="summary-card">
                <h3>Total Subjects</h3>
                <p>{semesters.reduce((sum, s) => sum + s.subjects.length, 0)}</p>
              </div>
              <div className="summary-card">
                <h3>Overall CGPA</h3>
                <p>{cgpa}</p>
              </div>
              <div className="summary-card">
                <h3>Overall Attendance</h3>
                <p>{overallAttendance}%</p>
              </div>
              <div className="summary-card">
                <h3>Semesters</h3>
                <p>{semesters.length}</p>
              </div>
            </div>

            {/* ── Efficiency Score Widget ── */}
            {effScore && (
              <div style={{
                background: "rgba(30,41,59,0.7)",
                border: `2px solid ${
                  effScore.band === "Excellent"         ? "#16a34a" :
                  effScore.band === "Good"              ? "#2563eb" :
                  effScore.band === "Needs Improvement" ? "#d97706" : "#dc2626"
                }`,
                borderRadius: "16px", padding: "24px", marginBottom: "28px",
              }}>
                <h2 style={{ marginBottom: "18px", fontSize: "18px", color: "#e2e8f0" }}>📊 Learning Efficiency Score</h2>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>

                  {/* Big score */}
                  <div style={{ textAlign: "center", minWidth: "130px" }}>
                    <div style={{
                      fontSize: "58px", fontWeight: 800, lineHeight: 1,
                      color:
                        effScore.band === "Excellent"         ? "#34d399" :
                        effScore.band === "Good"              ? "#60a5fa" :
                        effScore.band === "Needs Improvement" ? "#fbbf24" : "#f87171",
                    }}>
                      {effScore.finalScore}
                    </div>
                    <div style={{
                      display: "inline-block", marginTop: "8px",
                      padding: "3px 14px", borderRadius: "999px",
                      fontWeight: 700, fontSize: "13px",
                      background:
                        effScore.band === "Excellent"         ? "rgba(52,211,153,0.2)"  :
                        effScore.band === "Good"              ? "rgba(96,165,250,0.2)"  :
                        effScore.band === "Needs Improvement" ? "rgba(251,191,36,0.2)"  : "rgba(248,113,113,0.2)",
                      color:
                        effScore.band === "Excellent"         ? "#34d399" :
                        effScore.band === "Good"              ? "#60a5fa" :
                        effScore.band === "Needs Improvement" ? "#fbbf24" : "#f87171",
                      border: `1px solid ${
                        effScore.band === "Excellent"         ? "#34d399" :
                        effScore.band === "Good"              ? "#60a5fa" :
                        effScore.band === "Needs Improvement" ? "#fbbf24" : "#f87171"
                      }`,
                    }}>
                      {effScore.band}
                    </div>
                  </div>

                  {/* Parameter bars */}
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    {[
                      { label: "Skills (30%)",       value: effScore.skillScore,       color: "#a78bfa" },
                      { label: "Achievements (20%)", value: effScore.achievementScore, color: "#fbbf24" },
                      { label: "Activities (20%)",   value: effScore.activityScore,    color: "#34d399" },
                      { label: "SGPA (30%)",         value: effScore.sgpaScore,        color: "#38bdf8" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{label}</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color }}>{value ?? 0}/100</span>
                        </div>
                        <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${value ?? 0}%`, background: color, borderRadius: "3px", transition: "width 1s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CGPA box */}
                  <div style={{ background: "rgba(15,23,42,0.5)", borderRadius: "10px", padding: "14px 18px", textAlign: "center", minWidth: "90px" }}>
                    <p style={{ color: "#94a3b8", fontSize: "11px" }}>CGPA</p>
                    <p style={{ color: "#38bdf8", fontWeight: 700, fontSize: "26px" }}>{effScore.cgpa}</p>
                    <p style={{ color: "#64748b", fontSize: "10px", marginTop: "2px" }}>= {effScore.sgpaScore}/100</p>
                  </div>

                </div>
              </div>
            )}

            {/* ── Semester SGPA Overview Chart ── */}
            {semesters.length > 0 && (
              <>
                <h2 style={{ marginBottom: "12px" }}>Semester CGPA Overview</h2>
                <div className="chart-container" style={{ marginBottom: "30px" }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={semesters.map((s) => ({ name: s.semester, SGPA: parseFloat(s.sgpa) }))}
                      barCategoryGap="40%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#e2e8f0" }}
                        itemStyle={{ color: "#38bdf8" }}
                      />
                      {/* ✅ CHANGE: barSize reduced to 18 (was default ~full width) */}
                      <Bar dataKey="SGPA" radius={[3, 3, 0, 0]} barSize={18}>
                        {semesters.map((s) => (
                          <Cell key={s.semester} fill={sgpaColor(s.sgpa)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── Semester Tabs ── */}
            {semesters.length > 0 ? (
              <>
                <h2 style={{ marginBottom: "12px" }}>Semester Details</h2>

                {/* Tab buttons */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                  {semesters.map((s) => (
                    <button
                      key={s.semester}
                      onClick={() => setSelectedSemester(s.semester)}
                      style={{
                        padding: "10px 20px", borderRadius: "25px", border: "none",
                        cursor: "pointer", fontWeight: 600, fontSize: "14px",
                        background: selectedSemester === s.semester
                          ? "linear-gradient(90deg,#38bdf8,#2563eb)"
                          : "rgba(255,255,255,0.08)",
                        color: selectedSemester === s.semester ? "#fff" : "#94a3b8",
                        transition: "all 0.2s",
                      }}
                    >
                      {s.semester}
                      <span style={{ marginLeft: "8px", fontSize: "12px", opacity: 0.85 }}>
                        SGPA: {s.sgpa}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected semester detail */}
                {activeSem && (
                  <>
                    {/* Info bar */}
                    <div style={{
                      background: "rgba(30,41,59,0.6)", borderRadius: "12px",
                      padding: "20px 28px", marginBottom: "20px",
                      border: "1px solid rgba(56,189,248,0.3)",
                      display: "flex", alignItems: "center", gap: "30px", flexWrap: "wrap",
                    }}>
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: "13px" }}>Semester</p>
                        <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "20px" }}>{activeSem.semester}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: "13px" }}>SGPA</p>
                        <p style={{ color: "#38bdf8", fontWeight: 700, fontSize: "32px" }}>{activeSem.sgpa}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: "13px" }}>Subjects</p>
                        <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "20px" }}>{activeSem.subjects.length}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", fontSize: "13px" }}>Total Credits</p>
                        <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "20px" }}>
                          {activeSem.subjects.reduce((sum, s) => sum + Number(s.credits), 0)}
                        </p>
                      </div>
                    </div>

                    {/* Per-subject grade chart */}
                    {/* ✅ CHANGE: barSize={16} + radius [3,3,0,0] */}
                    <div className="chart-container" style={{ marginBottom: "24px" }}>
                      <p style={{ color: "#94a3b8", marginBottom: "12px", fontSize: "14px" }}>
                        Grade Points per Subject
                      </p>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={activeSem.subjects.map((s) => ({
                            name: s.subject_name,
                            GP: Number(s.grade_points),
                            grade: s.grade,
                          }))}
                          barCategoryGap="40%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8" }} />
                          <Tooltip
                            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            labelStyle={{ color: "#e2e8f0" }}
                            formatter={(val, name, props) => [val, `Grade: ${props.payload.grade}`]}
                          />
                          <Bar dataKey="GP" radius={[3, 3, 0, 0]} barSize={16}>
                            {activeSem.subjects.map((s) => (
                              <Cell key={s.subject_name} fill={GRADE_COLOR[s.grade] || "#38bdf8"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Subject cards */}
                    <div className="cards">
                      {activeSem.subjects.map((s, i) => (
                        <div key={i} className="card">
                          <h3>{s.subject_name}</h3>
                          <p>Marks: <strong style={{ color: "#e2e8f0" }}>{s.marks_scored}</strong></p>
                          <p>Grade:
                            <strong style={{ marginLeft: "6px", color: GRADE_COLOR[s.grade] || "#38bdf8", fontSize: "18px" }}>
                              {s.grade}
                            </strong>
                          </p>
                          <p>Grade Points: <strong style={{ color: "#38bdf8" }}>{s.grade_points}</strong></p>
                          <p>Credits: <strong style={{ color: "#e2e8f0" }}>{s.credits}</strong></p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <p style={{ fontSize: "18px" }}>No marks available yet.</p>
                <p style={{ fontSize: "14px", marginTop: "8px" }}>
                  Your marks will appear here once your mentor adds them.
                </p>
              </div>
            )}

            {/* ── Attendance Section ── */}
            <h2 style={{ marginTop: "30px", marginBottom: "16px" }}>Attendance</h2>
            {attendance.length > 0 ? (
              <div className="cards">
                {attendance.map((att, i) => {
                  // ✅ CHANGE: use present_days / total_days if available, else fall back to attendance_percentage
                  const pct = (att.present_days != null && att.total_days != null && att.total_days > 0)
                    ? ((att.present_days / att.total_days) * 100).toFixed(1)
                    : Number(att.attendance_percentage || 0).toFixed(1);

                  const eligible = parseFloat(pct) >= 75;

                  return (
                    <div key={i} className="card" style={{
                      borderTop: `3px solid ${eligible ? "#16a34a" : "#dc2626"}`,
                    }}>
                      <h3>{att.subject_name}</h3>
                      <p>Attendance:
                        <strong style={{
                          marginLeft: "6px",
                          color: eligible ? "#16a34a" : "#dc2626",
                          fontSize: "20px",
                        }}>
                          {pct}%
                        </strong>
                      </p>

                      {/* ✅ NEW: show present_days / total_days breakdown */}
                      {att.present_days != null && att.total_days != null && (
                        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                          {att.present_days} present / {att.total_days} total days
                        </p>
                      )}

                      <p>Semester: <strong style={{ color: "#e2e8f0" }}>{att.semester}</strong></p>

                      {/* ✅ NEW: eligibility badge */}
                      <div style={{
                        marginTop: "8px", fontSize: "12px", fontWeight: 600,
                        padding: "3px 10px", borderRadius: "999px", display: "inline-block",
                        background: eligible ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
                        color: eligible ? "#16a34a" : "#dc2626",
                        border: `1px solid ${eligible ? "#16a34a" : "#dc2626"}`,
                      }}>
                        {eligible ? "✓ Eligible for Exam" : "⚠ Below 75% — Shortage"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>No attendance data available.</p>
            )}

          </>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;