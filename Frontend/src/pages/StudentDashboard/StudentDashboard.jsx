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

  /* Decode department from JWT */
  const userDept = (() => {
    try {
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.department || "";
    } catch { return ""; }
  })();

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

  // ── FIX #6: Change password ──────────────
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

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
  /* ── FIX #6: Change password ── */
  const handleChangePassword = async () => {
    if (!curPwd || !newPwd) { setPwdMsg("❌ Fill both fields"); return; }
    try {
      const res  = await fetch("http://localhost:5000/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdMsg(`❌ ${data.message}`); return; }
      setPwdMsg("✅ Password changed successfully!");
      setCurPwd(""); setNewPwd("");
    } catch { setPwdMsg("❌ Server error"); }
  };

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
        <h2 style={{marginBottom:"2px"}}>SLEA</h2>
        {userDept && (
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)",fontWeight:500,
            letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"16px",marginTop:"2px"}}>
            {userDept} Dept
          </div>
        )}

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

        {/* FIX #6: Password tab */}
        <button
          onClick={() => setActiveTab("Password")}
          style={{ background: activeTab === "Password" ? "#38bdf8" : "#334155", marginBottom: "8px" }}
        >
          🔒 Password
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
            <h1 style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
              Welcome, {studentName} 
              {userDept && (
                <span style={{fontSize:"13px",fontWeight:600,background:"rgba(56,189,248,0.15)",
                  border:"1px solid rgba(56,189,248,0.3)",color:"#38bdf8",padding:"3px 12px",
                  borderRadius:"999px",letterSpacing:"0.3px"}}>
                  {userDept}
                </span>
              )}
            </h1>

            {/* ── Summary cards ── */}
            <div className="summary">
              <div className="summary-card">
                <h3>Total Subjects</h3>
                <p>{semesters.reduce((sum, s) => sum + s.subjects.length, 0)}</p>
              </div>
              <div className="summary-card">
                <h3>CGPA</h3>
                <p>{cgpa}</p>
              </div>
              <div className="summary-card">
                <h3>Attendance</h3>
                <p>{overallAttendance}%</p>
              </div>
              <div className="summary-card">
                <h3>Semesters</h3>
                <p>{semesters.length}</p>
              </div>
            </div>

            {/* ── Efficiency Score Widget ── */}
            {effScore && (() => {
              const bc =
                effScore.band === "Excellent"         ? "#34d399" :
                effScore.band === "Good"              ? "#60a5fa" :
                effScore.band === "Needs Improvement" ? "#fbbf24" : "#f87171";

              const pctIcon  = (p) => p >= 90 ? "🏆" : p >= 50 ? "📈" : "📉";
              const pctColor = (p) => p >= 75 ? "#34d399" : p >= 50 ? "#60a5fa" : "#f87171";

              const params = [
                { label:"Skills",       weight:"30%", color:"#a78bfa", dept: effScore.deptPercentile?.skill,        all: effScore.allPercentile?.skill       },
                { label:"Achievements", weight:"20%", color:"#fbbf24", dept: effScore.deptPercentile?.achievement,  all: effScore.allPercentile?.achievement  },
                { label:"Activities",   weight:"20%", color:"#34d399", dept: effScore.deptPercentile?.activity,     all: effScore.allPercentile?.activity     },
                { label:"CGPA",         weight:"30%", color:"#38bdf8", dept: effScore.deptPercentile?.cgpa,         all: effScore.allPercentile?.cgpa         },
              ];

              /* Attendance info row — separate, no weight in score */
              const attPct = overallAttendance ? parseFloat(overallAttendance) : null;

              return (
                <div style={{
                  background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",
                  border:`2px solid ${bc}`,
                  borderRadius:"20px", padding:"28px", marginBottom:"28px",
                  boxShadow:`0 8px 32px ${bc}22`,
                }}>

                  {/* Header row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
                    <h2 style={{ margin:0, fontSize:"18px", color:"#e2e8f0", fontWeight:700 }}>
                      📊 Learning Efficiency Score
                    </h2>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div style={{ background:"rgba(167,139,250,0.15)", border:"1px solid #a78bfa", borderRadius:"10px", padding:"6px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:"10px", color:"#a78bfa", fontWeight:600, letterSpacing:"0.5px" }}>DEPT RANK</div>
                        <div style={{ fontSize:"20px", fontWeight:800, color:"#a78bfa", lineHeight:1.2 }}>
                          #{effScore.deptRank ?? "—"}
                          <span style={{ fontSize:"11px", color:"#64748b", fontWeight:400 }}>/{effScore.deptTotal ?? "—"}</span>
                        </div>
                      </div>
                      <div style={{ background:"rgba(56,189,248,0.15)", border:"1px solid #38bdf8", borderRadius:"10px", padding:"6px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:"10px", color:"#38bdf8", fontWeight:600, letterSpacing:"0.5px" }}>OVERALL RANK</div>
                        <div style={{ fontSize:"20px", fontWeight:800, color:"#38bdf8", lineHeight:1.2 }}>
                          #{effScore.overallRank ?? "—"}
                          <span style={{ fontSize:"11px", color:"#64748b", fontWeight:400 }}>/{effScore.overallTotal ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:"24px", flexWrap:"wrap", alignItems:"flex-start" }}>

                    {/* Left — score circle + CGPA + overall standing */}
                    <div style={{ textAlign:"center", minWidth:"150px" }}>
                      {/* Circular score */}
                      <div style={{
                        width:"120px", height:"120px", borderRadius:"50%", margin:"0 auto",
                        background:`conic-gradient(${bc} ${effScore.finalScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <div style={{
                          width:"94px", height:"94px", borderRadius:"50%",
                          background:"rgba(10,16,30,0.95)",
                          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                        }}>
                          <span style={{ fontSize:"30px", fontWeight:800, color:bc, lineHeight:1 }}>{effScore.finalScore}</span>
                          <span style={{ fontSize:"9px", color:"#475569" }}>out of 100</span>
                        </div>
                      </div>

                      {/* Band */}
                      <div style={{
                        display:"inline-block", marginTop:"10px",
                        padding:"4px 16px", borderRadius:"999px", fontWeight:700, fontSize:"12px",
                        background:`${bc}22`, color:bc, border:`1px solid ${bc}55`,
                      }}>{effScore.band}</div>

                      {/* CGPA */}
                      <div style={{ marginTop:"12px", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"10px", padding:"10px 16px" }}>
                        <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"2px" }}>CGPA</div>
                        <div style={{ fontSize:"26px", fontWeight:800, color:"#38bdf8", lineHeight:1 }}>{effScore.cgpa}</div>
                      </div>

                      {/* Overall standing pills */}
                      <div style={{ marginTop:"10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"10px 12px" }}>
                        <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"6px" }}>Overall Standing</div>
                        <div style={{ fontSize:"12px", color:pctColor(effScore.allPercentile?.overall??0), fontWeight:600, marginBottom:"3px" }}>
                          {pctIcon(effScore.allPercentile?.overall??0)} Top {Math.max(1, 100-(effScore.allPercentile?.overall??0))}% overall
                        </div>
                        <div style={{ fontSize:"12px", color:pctColor(effScore.deptPercentile?.overall??0), fontWeight:600 }}>
                          {pctIcon(effScore.deptPercentile?.overall??0)} Top {Math.max(1, 100-(effScore.deptPercentile?.overall??0))}% in dept
                        </div>
                      </div>
                    </div>

                    {/* Right — parameter cards (NO raw scores, only percentiles + bar) */}
                    <div style={{ flex:1, minWidth:"260px" }}>
                      {params.map(({ label, weight, color, dept, all }) => {
                        const deptPct = dept ?? 0;
                        const allPct  = all  ?? 0;
                        return (
                          <div key={label} style={{
                            background:"rgba(255,255,255,0.03)",
                            border:"1px solid rgba(255,255,255,0.07)",
                            borderRadius:"12px", padding:"14px 16px", marginBottom:"10px",
                          }}>
                            {/* Label + weight */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                              <span style={{ fontSize:"14px", color:"#e2e8f0", fontWeight:700 }}>{label}</span>
                              <span style={{ fontSize:"11px", color:"#475569", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:"999px" }}>{weight}</span>
                            </div>

                            {/* Two percentile bars side by side */}
                            <div style={{ display:"flex", gap:"10px" }}>

                              {/* Dept */}
                              <div style={{ flex:1, background:`${pctColor(deptPct)}10`, border:`1px solid ${pctColor(deptPct)}30`, borderRadius:"10px", padding:"10px 12px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"6px" }}>
                                  <span style={{ fontSize:"15px" }}>{pctIcon(deptPct)}</span>
                                  <span style={{ fontSize:"10px", color:"#64748b", fontWeight:600 }}>In Department</span>
                                </div>
                                {/* Bar */}
                                <div style={{ height:"6px", background:"rgba(255,255,255,0.07)", borderRadius:"3px", overflow:"hidden", marginBottom:"5px" }}>
                                  <div style={{ height:"100%", width:`${deptPct}%`, background:`linear-gradient(90deg,${pctColor(deptPct)}88,${pctColor(deptPct)})`, borderRadius:"3px", transition:"width 1.2s ease" }}/>
                                </div>
                                <div style={{ fontSize:"13px", fontWeight:800, color:pctColor(deptPct) }}>
                                  Better than {deptPct}%
                                </div>
                              </div>

                              {/* Overall */}
                              <div style={{ flex:1, background:`${pctColor(allPct)}10`, border:`1px solid ${pctColor(allPct)}30`, borderRadius:"10px", padding:"10px 12px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"6px" }}>
                                  <span style={{ fontSize:"15px" }}>{pctIcon(allPct)}</span>
                                  <span style={{ fontSize:"10px", color:"#64748b", fontWeight:600 }}>Overall</span>
                                </div>
                                <div style={{ height:"6px", background:"rgba(255,255,255,0.07)", borderRadius:"3px", overflow:"hidden", marginBottom:"5px" }}>
                                  <div style={{ height:"100%", width:`${allPct}%`, background:`linear-gradient(90deg,${pctColor(allPct)}88,${pctColor(allPct)})`, borderRadius:"3px", transition:"width 1.2s ease" }}/>
                                </div>
                                <div style={{ fontSize:"13px", fontWeight:800, color:pctColor(allPct) }}>
                                  Better than {allPct}%
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}

                      {/* Attendance — info row, no weight in score */}
                      {attPct !== null && (
                        <div style={{
                          background:"rgba(255,255,255,0.03)",
                          border:`1px solid ${attPct>=75?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)"}`,
                          borderRadius:"12px", padding:"14px 16px", marginBottom:"10px",
                        }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                            <span style={{ fontSize:"14px", color:"#e2e8f0", fontWeight:700 }}>
                              Attendance
                              <span style={{ fontSize:"10px", color:"#475569", marginLeft:"8px", background:"rgba(255,255,255,0.07)", padding:"2px 8px", borderRadius:"999px" }}>info only</span>
                            </span>
                            <span style={{ fontSize:"18px", fontWeight:800, color: attPct>=75?"#34d399":"#f87171" }}>
                              {attPct}%
                              <span style={{ fontSize:"11px", fontWeight:400, color:"#64748b", marginLeft:"4px" }}>{attPct>=75?"✓ Eligible":"⚠ Shortage"}</span>
                            </span>
                          </div>
                          <div style={{ height:"8px", background:"rgba(255,255,255,0.07)", borderRadius:"4px", overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${Math.min(attPct,100)}%`,
                              background:attPct>=75?"linear-gradient(90deg,#34d39988,#34d399)":"linear-gradient(90deg,#f8717188,#f87171)",
                              borderRadius:"4px", transition:"width 1.2s ease" }}/>
                          </div>
                          <div style={{ marginTop:"8px", fontSize:"11px", color:"#64748b" }}>
                            Overall attendance across all semesters — not included in efficiency score
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              );
            })()}

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
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
                        labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                        itemStyle={{ color: "#38bdf8" }}
                        wrapperStyle={{ outline: "none" }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
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

                    {/* FIX #7: Grade Reference shown in chart section */}
                    <div style={{
                      background:"rgba(30,41,59,0.7)", border:"1px solid rgba(56,189,248,0.2)",
                      borderRadius:"10px", padding:"14px 18px", marginBottom:"18px",
                    }}>
                      <p style={{color:"#94a3b8",fontSize:"13px",fontWeight:600,marginBottom:"10px"}}>
                        📊 Grade Reference
                      </p>
                      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                        {GRADE_REFERENCE.map(({range,grade,pts})=>(
                          <div key={grade} style={{
                            background:(GRADE_COLOR[grade]||"#64748b")+"18",
                            border:`1px solid ${GRADE_COLOR[grade]||"#64748b"}`,
                            borderRadius:"8px",padding:"6px 12px",textAlign:"center",minWidth:"76px",
                          }}>
                            <p style={{fontWeight:700,color:GRADE_COLOR[grade],fontSize:"15px"}}>{grade}</p>
                            <p style={{fontSize:"10px",color:"#94a3b8"}}>{range}</p>
                            <p style={{fontSize:"10px",color:"#94a3b8"}}>{pts} pts</p>
                          </div>
                        ))}
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
                            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
                            labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                            itemStyle={{ color: "#94a3b8" }}
                            wrapperStyle={{ outline: "none" }}
                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
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

        {/* ══════════════ FIX #6: PASSWORD TAB ══════════════ */}
        {activeTab === "Password" && (
          <div style={{maxWidth:"420px"}}>
            <h2 style={{marginBottom:"24px"}}>🔒 Change Password</h2>
            {pwdMsg && (
              <div style={{
                padding:"10px 16px", marginBottom:"16px", borderRadius:"8px", fontWeight:500,
                background: pwdMsg.startsWith("✅") ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)",
                color:      pwdMsg.startsWith("✅") ? "#34d399" : "#f87171",
                border:`1px solid ${pwdMsg.startsWith("✅")?"#34d399":"#f87171"}`,
              }}>{pwdMsg}</div>
            )}
            <div style={{background:"rgba(30,41,59,0.7)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:"12px",padding:"24px"}}>
              <input
                type="password"
                placeholder="Current Password"
                value={curPwd}
                onChange={e=>{setCurPwd(e.target.value);setPwdMsg("");}}
                style={{width:"100%",padding:"11px 14px",fontSize:"15px",borderRadius:"8px",
                  border:"1px solid rgba(255,255,255,0.15)",outline:"none",marginBottom:"14px",
                  boxSizing:"border-box",fontFamily:"inherit",background:"rgba(15,23,42,0.5)",color:"#e2e8f0"}}
              />
              <input
                type="password"
                placeholder="New Password (min 4 chars)"
                value={newPwd}
                onChange={e=>{setNewPwd(e.target.value);setPwdMsg("");}}
                style={{width:"100%",padding:"11px 14px",fontSize:"15px",borderRadius:"8px",
                  border:"1px solid rgba(255,255,255,0.15)",outline:"none",marginBottom:"14px",
                  boxSizing:"border-box",fontFamily:"inherit",background:"rgba(15,23,42,0.5)",color:"#e2e8f0"}}
              />
              <button
                onClick={handleChangePassword}
                style={{width:"100%",padding:"12px",background:"linear-gradient(90deg,#1e3c72,#2a5298)",
                  color:"#fff",border:"none",borderRadius:"8px",fontSize:"15px",fontWeight:600,cursor:"pointer"}}
              >
                Update Password
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;