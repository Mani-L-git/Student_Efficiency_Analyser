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

  const userDept = (() => {
    try {
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.department || "";
    } catch { return ""; }
  })();

  // ── Data state ──────────────────────────
  const [studentName,   setStudentName]   = useState("");
  const [cgpa,          setCgpa]          = useState("0.00");
  const [semesters,     setSemesters]     = useState([]);
  const [attendance,    setAttendance]    = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [replies,       setReplies]       = useState({});

  // ── UI state ────────────────────────────
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [activeTab,        setActiveTab]        = useState("Dashboard");
  const [loading,          setLoading]          = useState(true);

  // ── Reply state ─────────────────────────
  const [replyText,   setReplyText]   = useState({});
  const [isListening, setIsListening] = useState(null);

  // ── Efficiency score ─────────────────────
  const [effScore, setEffScore] = useState(null);

  // ── Change password ──────────────────────
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

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
        fetchMarks(), fetchStudent(), fetchAttendance(),
        fetchAnnouncements(), fetchEfficiencyScore(),
      ]);
    } finally { setLoading(false); }
  };

  const fetchMarks = async () => {
    try {
      const res  = await fetch(`https://slea-backend.onrender.com/student-marks/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setSemesters(data.semesters || []);
      setCgpa(data.cgpa || "0.00");
      if (data.semesters?.length > 0) setSelectedSemester(data.semesters[0].semester);
    } catch (err) { console.error("Marks error:", err); }
  };

  const fetchEfficiencyScore = async () => {
    try {
      const res  = await fetch(`https://slea-backend.onrender.com/efficiency/${studentId}`, { headers: authHeader });
      if (!res.ok) return;
      setEffScore(await res.json());
    } catch (err) { console.error("Efficiency error:", err); }
  };

  const fetchStudent = async () => {
    try {
      const res  = await fetch(`https://slea-backend.onrender.com/student/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setStudentName(data?.name || "Student");
    } catch (err) { console.error("Student error:", err); }
  };

  const fetchAttendance = async () => {
    try {
      const res  = await fetch(`https://slea-backend.onrender.com/student-attendance/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Attendance error:", err); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res  = await fetch("https://slea-backend.onrender.com/announcements", { headers: authHeader });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAnnouncements(list);
      for (const ann of list) fetchReplies(ann.id);
    } catch (err) { console.error("Announcements error:", err); }
  };

  const fetchReplies = async (annId) => {
    try {
      const res  = await fetch(`https://slea-backend.onrender.com/announcement/${annId}/replies`, { headers: authHeader });
      const data = await res.json();
      setReplies(prev => ({ ...prev, [annId]: Array.isArray(data) ? data : [] }));
    } catch (err) { console.error("Replies error:", err); }
  };

  /* ── Voice reply ── */
  const startVoice = (annId) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported. Use Chrome or Edge."); return; }
    const rec = new SR();
    rec.lang = "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1;
    setIsListening(annId);
    rec.onresult = (e) => { setReplyText(prev => ({ ...prev, [annId]: e.results[0][0].transcript })); setIsListening(null); };
    rec.onerror  = () => setIsListening(null);
    rec.onend    = () => setIsListening(null);
    rec.start();
  };

  const submitReply = async (annId, isVoice = false) => {
    const text = (replyText[annId] || "").trim();
    if (!text) return;
    try {
      const res = await fetch(`https://slea-backend.onrender.com/announcement/${annId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ reply_text: text, is_voice: isVoice }),
      });
      if (!res.ok) return;
      setReplyText(prev => ({ ...prev, [annId]: "" }));
      fetchReplies(annId);
    } catch (err) { console.error("Reply error:", err); }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    if (!curPwd || !newPwd) { setPwdMsg("❌ Fill both fields"); return; }
    try {
      const res  = await fetch("https://slea-backend.onrender.com/change-password", {
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

  /* ── Derived values ── */
  const activeSem = semesters.find((s) => s.semester === selectedSemester) || null;

  const overallAttendance = attendance.length > 0
    ? (attendance.reduce((sum, a) => sum + Number(a.attendance_percentage || 0), 0) / attendance.length).toFixed(1)
    : "0.0";

  /* attendance shortages count */
  const shortageCount = attendance.filter(a => {
    const pct = a.present_days != null && a.total_days > 0
      ? (a.present_days / a.total_days) * 100
      : Number(a.attendance_percentage || 0);
    return pct < 75;
  }).length;

  /* best semester by SGPA */
  const bestSem = semesters.length > 0
    ? semesters.reduce((best, s) => parseFloat(s.sgpa) > parseFloat(best.sgpa) ? s : best, semesters[0])
    : null;

  /* total subjects across all semesters */
  const totalSubjects = semesters.reduce((sum, s) => sum + s.subjects.length, 0);

  /* subjects with F grade */
  const failCount = semesters.reduce((sum, s) => sum + s.subjects.filter(sub => sub.grade === "F").length, 0);

  /* top subject by marks */
  const allSubjects = semesters.flatMap(s => s.subjects);
  const topSubject  = allSubjects.length > 0
    ? allSubjects.reduce((best, sub) => Number(sub.marks_scored) > Number(best.marks_scored) ? sub : best, allSubjects[0])
    : null;

  const sgpaColor = (sgpa) => {
    const v = parseFloat(sgpa);
    if (v >= 8) return "#16a34a";
    if (v >= 6) return "#2563eb";
    if (v >= 5) return "#d97706";
    return "#dc2626";
  };

  /* helper — get attendance for a specific semester */
  const getAttForSem = (semName) => {
    const row = attendance.find(a => a.semester === semName);
    if (!row) return null;
    const pct = row.present_days != null && row.total_days > 0
      ? ((row.present_days / row.total_days) * 100).toFixed(1)
      : Number(row.attendance_percentage || 0).toFixed(1);
    return { pct, presentDays: row.present_days, totalDays: row.total_days };
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter','Segoe UI',sans-serif; }
        .sum-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px; margin-bottom:28px; }
        .sum-card  { background:rgba(30,41,59,0.75); border:1px solid rgba(255,255,255,0.08);
                     border-radius:14px; padding:18px 20px; }
        .sum-label { font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;
                     letter-spacing:0.5px; margin-bottom:6px; }
        .sum-value { font-size:28px; font-weight:800; line-height:1; }
        .sum-sub   { font-size:11px; color:#64748b; margin-top:4px; }
        .sem-info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:12px; margin-bottom:20px; }
        .sem-info-cell { background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.18);
                         border-radius:10px; padding:14px 16px; }
        .sem-info-label { font-size:11px; color:#64748b; margin-bottom:4px; }
        .sem-info-value { font-size:22px; font-weight:800; }
        .att-pill { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px;
                    font-weight:600; margin-top:6px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <div className="sidebar">
        <h2 style={{ marginBottom:"2px" }}>SLEA</h2>
        {userDept && (
          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.55)", fontWeight:500,
            letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"16px", marginTop:"2px" }}>
            {userDept} Dept
          </div>
        )}
        {[
          { id:"Dashboard",     label:"📊 Dashboard"     },
          { id:"Announcements", label:"📢 Announcements" },
          { id:"Password",      label:"🔒 Password"      },
        ].map(btn => (
          <button key={btn.id} onClick={() => setActiveTab(btn.id)} style={{
            background: activeTab === btn.id ? "#38bdf8" : "#334155",
            marginBottom:"8px", position:"relative",
          }}>
            {btn.label}
            {btn.id === "Announcements" && announcements.length > 0 && (
              <span style={{ position:"absolute", top:"6px", right:"10px",
                background:"#ef4444", color:"#fff", fontSize:"11px",
                borderRadius:"999px", padding:"1px 7px", fontWeight:700 }}>
                {announcements.length}
              </span>
            )}
          </button>
        ))}
        <button onClick={handleLogout} style={{ background:"#ef4444", marginTop:"auto" }}>
          Logout
        </button>
      </div>

      {/* ══════════════ MAIN ══════════════ */}
      <div className="main-content">

        {/* ════════════ ANNOUNCEMENTS ════════════ */}
        {activeTab === "Announcements" && (
          <div>
            <h1 style={{ marginBottom:"20px" }}>📢 Announcements</h1>
            {announcements.length === 0
              ? <p style={{ color:"#94a3b8", fontSize:"16px" }}>No announcements yet.</p>
              : announcements.map(ann => (
                <div key={ann.id} style={{
                  background:"rgba(30,41,59,0.7)", border:"1px solid rgba(56,189,248,0.25)",
                  borderRadius:"12px", padding:"20px 22px", marginBottom:"18px",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                    <span style={{ fontSize:"11px", padding:"2px 10px", borderRadius:"999px",
                      background:"rgba(248,113,113,0.12)", color:"#f87171",
                      border:"1px solid rgba(248,113,113,0.25)", fontWeight:600 }}>
                      {ann.target === "all" ? "Super Admin" : ann.target + " Admin"}
                    </span>
                    <span style={{ fontSize:"11px", color:"#64748b", marginLeft:"auto" }}>
                      {ann.created_at ? new Date(ann.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <p style={{ fontWeight:700, fontSize:"16px", color:"#e2e8f0", marginBottom:"6px" }}>{ann.title}</p>
                  <p style={{ color:"#94a3b8", fontSize:"14px", marginBottom:"14px" }}>{ann.message}</p>
                  {(replies[ann.id] || []).length > 0 && (
                    <div style={{ marginBottom:"12px", paddingLeft:"12px", borderLeft:"2px solid rgba(56,189,248,0.3)" }}>
                      {(replies[ann.id] || []).map((r, i) => (
                        <div key={i} style={{ background:"rgba(15,23,42,0.5)", borderRadius:"8px", padding:"8px 12px", marginBottom:"6px" }}>
                          <span style={{ fontSize:"12px", color:"#38bdf8", fontWeight:600 }}>{r.user_name || "You"}</span>
                          {r.is_voice === 1 && <span style={{ fontSize:"10px", color:"#a78bfa", marginLeft:"6px" }}>🎤 voice</span>}
                          <p style={{ fontSize:"13px", color:"#cbd5e1", marginTop:"2px" }}>{r.reply_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                    <input style={{ flex:1, background:"rgba(15,23,42,0.6)",
                      border:"1px solid rgba(56,189,248,0.3)", borderRadius:"8px",
                      padding:"9px 14px", color:"#e2e8f0", fontSize:"13px",
                      outline:"none", fontFamily:"inherit" }}
                      placeholder="Write a reply…"
                      value={replyText[ann.id] || ""}
                      onChange={e => setReplyText(prev => ({ ...prev, [ann.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && submitReply(ann.id, false)}/>
                    <button onClick={() => startVoice(ann.id)} style={{
                      padding:"9px 12px", borderRadius:"8px", border:"none", cursor:"pointer",
                      background: isListening === ann.id ? "rgba(239,68,68,0.4)" : "rgba(56,189,248,0.15)",
                      fontSize:"16px", animation: isListening === ann.id ? "pulse 1s infinite" : "none",
                    }}>🎤</button>
                    <button onClick={() => submitReply(ann.id, false)} style={{
                      padding:"9px 18px", borderRadius:"8px", border:"none",
                      background:"#38bdf8", color:"#0f172a", fontWeight:700, fontSize:"13px", cursor:"pointer",
                    }}>Send</button>
                  </div>
                  {isListening === ann.id && (
                    <p style={{ color:"#ef4444", fontSize:"12px", marginTop:"6px" }}>🎤 Listening… speak now</p>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ════════════ PASSWORD ════════════ */}
        {activeTab === "Password" && (
          <div style={{ maxWidth:"420px" }}>
            <h2 style={{ marginBottom:"24px" }}>🔒 Change Password</h2>
            {pwdMsg && (
              <div style={{ padding:"10px 16px", marginBottom:"16px", borderRadius:"8px", fontWeight:500,
                background: pwdMsg.startsWith("✅") ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)",
                color:      pwdMsg.startsWith("✅") ? "#34d399" : "#f87171",
                border:`1px solid ${pwdMsg.startsWith("✅") ? "#34d399" : "#f87171"}`,
              }}>{pwdMsg}</div>
            )}
            <div style={{ background:"rgba(30,41,59,0.7)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"12px", padding:"24px" }}>
              {[
                { ph:"Current Password",       val:curPwd, set:setCurPwd },
                { ph:"New Password (min 4)",    val:newPwd, set:setNewPwd },
              ].map(f => (
                <input key={f.ph} type="password" placeholder={f.ph} value={f.val}
                  onChange={e => { f.set(e.target.value); setPwdMsg(""); }}
                  style={{ width:"100%", padding:"11px 14px", fontSize:"15px", borderRadius:"8px",
                    border:"1px solid rgba(255,255,255,0.15)", outline:"none", marginBottom:"14px",
                    boxSizing:"border-box", fontFamily:"inherit",
                    background:"rgba(15,23,42,0.5)", color:"#e2e8f0" }}/>
              ))}
              <button onClick={handleChangePassword} style={{ width:"100%", padding:"12px",
                background:"linear-gradient(90deg,#1e3c72,#2a5298)", color:"#fff",
                border:"none", borderRadius:"8px", fontSize:"15px", fontWeight:600, cursor:"pointer" }}>
                Update Password
              </button>
            </div>
          </div>
        )}

        {/* ════════════ DASHBOARD ════════════ */}
        {activeTab === "Dashboard" && (
          <>
            <h1 style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
              Welcome, {studentName}
              {userDept && (
                <span style={{ fontSize:"13px", fontWeight:600, background:"rgba(56,189,248,0.15)",
                  border:"1px solid rgba(56,189,248,0.3)", color:"#38bdf8",
                  padding:"3px 12px", borderRadius:"999px", letterSpacing:"0.3px" }}>
                  {userDept}
                </span>
              )}
            </h1>

            {/* ══════════════════════════════════════════
                IMPROVED SUMMARY CARDS
            ══════════════════════════════════════════ */}
            <div className="sum-grid">

              {/* Overall CGPA */}
              <div className="sum-card" style={{ borderTop:`3px solid ${parseFloat(cgpa) >= 7 ? "#16a34a" : parseFloat(cgpa) >= 5 ? "#d97706" : "#dc2626"}` }}>
                <div className="sum-label">Overall CGPA</div>
                <div className="sum-value" style={{ color: parseFloat(cgpa) >= 7 ? "#34d399" : parseFloat(cgpa) >= 5 ? "#fbbf24" : "#f87171" }}>
                  {cgpa}
                </div>
               
              </div>

              {/* Semesters completed */}
              <div className="sum-card" style={{ borderTop:"3px solid #2563eb" }}>
                <div className="sum-label">Semesters</div>
                <div className="sum-value" style={{ color:"#60a5fa" }}>{semesters.length}</div>
                <div className="sum-sub">{totalSubjects} subjects total</div>
              </div>

              {/* Overall Attendance */}
              <div className="sum-card" style={{ borderTop:`3px solid ${parseFloat(overallAttendance) >= 75 ? "#16a34a" : "#dc2626"}` }}>
                <div className="sum-label">Overall Attendance</div>
                <div className="sum-value" style={{ color: parseFloat(overallAttendance) >= 75 ? "#34d399" : "#f87171" }}>
                  {overallAttendance}%
                </div>
                <div className="sum-sub">
                  {shortageCount > 0
                    ? <span style={{ color:"#f87171" }}>⚠ {shortageCount} sem{shortageCount > 1 ? "s" : ""} below 75%</span>
                    : <span style={{ color:"#34d399" }}></span>}
                </div>
              </div>

              {/* Best Semester */}
              {bestSem && (
                <div className="sum-card" style={{ borderTop:"3px solid #7c3aed" }}>
                  <div className="sum-label">Best Semester</div>
                  <div className="sum-value" style={{ color:"#a78bfa" }}>{parseFloat(bestSem.sgpa).toFixed(2)}</div>
                  <div className="sum-sub">{bestSem.semester} — SGPA</div>
                </div>
              )}

              {/* Efficiency score */}
              {effScore && (
                <div className="sum-card" style={{ borderTop:`3px solid ${
                  effScore.band==="Excellent"?"#16a34a":effScore.band==="Good"?"#2563eb":
                  effScore.band==="Needs Improvement"?"#d97706":"#dc2626"}` }}>
                  <div className="sum-label">Efficiency</div>
                  <div className="sum-value" style={{ color:
                    effScore.band==="Excellent"?"#34d399":effScore.band==="Good"?"#60a5fa":
                    effScore.band==="Needs Improvement"?"#fbbf24":"#f87171" }}>
                    {effScore.finalScore}
                  </div>
                  <div className="sum-sub">{effScore.band} · Rank #{effScore.deptRank}/{effScore.deptTotal}</div>
                </div>
              )}

              

              {/* Fail count */}
              <div className="sum-card" style={{ borderTop:`3px solid ${failCount > 0 ? "#dc2626" : "#16a34a"}` }}>
                <div className="sum-label">Arrears</div>
                <div className="sum-value" style={{ color: failCount > 0 ? "#f87171" : "#34d399" }}>
                  {failCount}
                </div>
                <div className="sum-sub">{failCount > 0 ? "subject(s) with F grade" : "No arrears "}</div>
              </div>

            </div>

            {/* ══════════════════════════════════════════
                EFFICIENCY SCORE WIDGET
            ══════════════════════════════════════════ */}
            {effScore && (() => {
              const bc =
                effScore.band === "Excellent"         ? "#34d399" :
                effScore.band === "Good"              ? "#60a5fa" :
                effScore.band === "Needs Improvement" ? "#fbbf24" : "#f87171";

              const pctIcon  = (p) => p >= 90 ? "🏆" : p >= 50 ? "📈" : "📉";
              const pctColor = (p) => p >= 75 ? "#34d399" : p >= 50 ? "#60a5fa" : "#f87171";

              const params = [
                { label:"Skills",       weight:"30%", color:"#a78bfa", dept: effScore.deptPercentile?.skill,       all: effScore.allPercentile?.skill       },
                { label:"Achievements", weight:"20%", color:"#fbbf24", dept: effScore.deptPercentile?.achievement, all: effScore.allPercentile?.achievement  },
                { label:"Activities",   weight:"20%", color:"#34d399", dept: effScore.deptPercentile?.activity,    all: effScore.allPercentile?.activity     },
                { label:"CGPA",         weight:"30%", color:"#38bdf8", dept: effScore.deptPercentile?.cgpa,        all: effScore.allPercentile?.cgpa         },
              ];

              return (
                <div style={{
                  background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))",
                  border:`2px solid ${bc}`, borderRadius:"20px", padding:"28px",
                  marginBottom:"28px", boxShadow:`0 8px 32px ${bc}22`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
                    <h2 style={{ margin:0, fontSize:"18px", color:"#e2e8f0", fontWeight:700 }}>📊 Learning Efficiency Score</h2>
                    <div style={{ display:"flex", gap:"10px" }}>
                      <div style={{ background:"rgba(167,139,250,0.15)", border:"1px solid #a78bfa", borderRadius:"10px", padding:"6px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:"10px", color:"#a78bfa", fontWeight:600, letterSpacing:"0.5px" }}>DEPT RANK</div>
                        <div style={{ fontSize:"20px", fontWeight:800, color:"#a78bfa", lineHeight:1.2 }}>
                          #{effScore.deptRank ?? "—"}<span style={{ fontSize:"11px", color:"#64748b", fontWeight:400 }}>/{effScore.deptTotal ?? "—"}</span>
                        </div>
                      </div>
                      <div style={{ background:"rgba(56,189,248,0.15)", border:"1px solid #38bdf8", borderRadius:"10px", padding:"6px 16px", textAlign:"center" }}>
                        <div style={{ fontSize:"10px", color:"#38bdf8", fontWeight:600, letterSpacing:"0.5px" }}>OVERALL RANK</div>
                        <div style={{ fontSize:"20px", fontWeight:800, color:"#38bdf8", lineHeight:1.2 }}>
                          #{effScore.overallRank ?? "—"}<span style={{ fontSize:"11px", color:"#64748b", fontWeight:400 }}>/{effScore.overallTotal ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:"24px", flexWrap:"wrap", alignItems:"flex-start" }}>
                    <div style={{ textAlign:"center", minWidth:"150px" }}>
                      <div style={{
                        width:"120px", height:"120px", borderRadius:"50%", margin:"0 auto",
                        background:`conic-gradient(${bc} ${effScore.finalScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <div style={{ width:"94px", height:"94px", borderRadius:"50%",
                          background:"rgba(10,16,30,0.95)", display:"flex",
                          flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:"30px", fontWeight:800, color:bc, lineHeight:1 }}>{effScore.finalScore}</span>
                          <span style={{ fontSize:"9px", color:"#475569" }}>out of 100</span>
                        </div>
                      </div>
                      <div style={{ display:"inline-block", marginTop:"10px", padding:"4px 16px", borderRadius:"999px",
                        fontWeight:700, fontSize:"12px", background:`${bc}22`, color:bc, border:`1px solid ${bc}55` }}>
                        {effScore.band}
                      </div>
                      <div style={{ marginTop:"12px", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"10px", padding:"10px 16px" }}>
                        <div style={{ fontSize:"10px", color:"#64748b", marginBottom:"2px" }}>CGPA</div>
                        <div style={{ fontSize:"26px", fontWeight:800, color:"#38bdf8", lineHeight:1 }}>{effScore.cgpa}</div>
                      </div>
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

                    <div style={{ flex:1, minWidth:"260px" }}>
                      {params.map(({ label, weight, color, dept, all }) => {
                        const deptPct = dept ?? 0;
                        const allPct  = all  ?? 0;
                        return (
                          <div key={label} style={{ background:"rgba(255,255,255,0.03)",
                            border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px",
                            padding:"14px 16px", marginBottom:"10px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                              <span style={{ fontSize:"14px", color:"#e2e8f0", fontWeight:700 }}>{label}</span>
                              <span style={{ fontSize:"11px", color:"#475569", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:"999px" }}>{weight}</span>
                            </div>
                            <div style={{ display:"flex", gap:"10px" }}>
                              {[{ lbl:"In Department", val:deptPct },{ lbl:"Overall", val:allPct }].map(bar => (
                                <div key={bar.lbl} style={{ flex:1, background:`${pctColor(bar.val)}10`,
                                  border:`1px solid ${pctColor(bar.val)}30`, borderRadius:"10px", padding:"10px 12px" }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"6px" }}>
                                    <span style={{ fontSize:"15px" }}>{pctIcon(bar.val)}</span>
                                    <span style={{ fontSize:"10px", color:"#64748b", fontWeight:600 }}>{bar.lbl}</span>
                                  </div>
                                  <div style={{ height:"6px", background:"rgba(255,255,255,0.07)", borderRadius:"3px", overflow:"hidden", marginBottom:"5px" }}>
                                    <div style={{ height:"100%", width:`${bar.val}%`,
                                      background:`linear-gradient(90deg,${pctColor(bar.val)}88,${pctColor(bar.val)})`,
                                      borderRadius:"3px", transition:"width 1.2s ease" }}/>
                                  </div>
                                  <div style={{ fontSize:"13px", fontWeight:800, color:pctColor(bar.val) }}>Better than {bar.val}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════
                SEMESTER SGPA CHART
            ══════════════════════════════════════════ */}
            {semesters.length > 0 && (
              <>
                <h2 style={{ marginBottom:"12px" }}>Semester CGPA Overview</h2>
                <div className="chart-container" style={{ marginBottom:"30px" }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={semesters.map(s => ({ name: s.semester, SGPA: parseFloat(s.sgpa) }))}
                      barCategoryGap="40%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:12 }} />
                      <YAxis domain={[0, 10]} tick={{ fill:"#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"8px" }}
                        labelStyle={{ color:"#e2e8f0", fontWeight:600 }}
                        itemStyle={{ color:"#38bdf8" }}
                        wrapperStyle={{ outline:"none" }}
                        cursor={{ fill:"rgba(255,255,255,0.05)" }}/>
                      <Bar dataKey="SGPA" radius={[3,3,0,0]} barSize={18}>
                        {semesters.map(s => <Cell key={s.semester} fill={sgpaColor(s.sgpa)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════
                SEMESTER TABS + DETAILS (attendance inside)
            ══════════════════════════════════════════ */}
            {semesters.length > 0 ? (
              <>
                <h2 style={{ marginBottom:"12px" }}>Semester Details</h2>

                {/* Tab buttons */}
                <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
                  {semesters.map(s => {
                    const att = getAttForSem(s.semester);
                    const attOk = att ? parseFloat(att.pct) >= 75 : null;
                    return (
                      <button key={s.semester} onClick={() => setSelectedSemester(s.semester)} style={{
                        padding:"10px 20px", borderRadius:"25px", border:"none",
                        cursor:"pointer", fontWeight:600, fontSize:"14px",
                        background: selectedSemester === s.semester
                          ? "linear-gradient(90deg,#38bdf8,#2563eb)"
                          : "rgba(255,255,255,0.08)",
                        color: selectedSemester === s.semester ? "#fff" : "#94a3b8",
                        transition:"all 0.2s", position:"relative",
                      }}>
                        {s.semester}
                        <span style={{ marginLeft:"8px", fontSize:"12px", opacity:0.85 }}></span>
                        
                      </button>
                    );
                  })}
                </div>

                {/* Selected semester detail */}
                {activeSem && (() => {
                  const att = getAttForSem(activeSem.semester);
                  const attColor = att
                    ? (parseFloat(att.pct) >= 75 ? "#4ade80" : "#f87171")
                    : "#94a3b8";

                  return (
                    <>
                      {/* ── Semester info grid (includes attendance) ── */}
                      <div className="sem-info-grid">

                        <div className="sem-info-cell">
                          <div className="sem-info-label">Semester</div>
                          <div className="sem-info-value" style={{ color:"#e2e8f0", fontSize:"18px" }}>{activeSem.semester}</div>
                        </div>

                        <div className="sem-info-cell">
                          <div className="sem-info-label">SGPA</div>
                          <div className="sem-info-value" style={{ color:"#38bdf8" }}>{activeSem.sgpa}</div>
                        </div>

                        <div className="sem-info-cell">
                          <div className="sem-info-label">Subjects</div>
                          <div className="sem-info-value" style={{ color:"#e2e8f0" }}>{activeSem.subjects.length}</div>
                        </div>

                        <div className="sem-info-cell">
                          <div className="sem-info-label">Total Credits</div>
                          <div className="sem-info-value" style={{ color:"#e2e8f0" }}>
                            {activeSem.subjects.reduce((sum, s) => sum + Number(s.credits), 0)}
                          </div>
                        </div>

                        {/* ── ATTENDANCE INSIDE SEM DETAILS ── */}
                        {att ? (
                          <div className="sem-info-cell" style={{
                            border:`1px solid ${parseFloat(att.pct) >= 75 ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
                            background: parseFloat(att.pct) >= 75 ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)",
                          }}>
                            <div className="sem-info-label">Attendance</div>
                            <div className="sem-info-value" style={{ color:attColor, fontSize:"26px" }}>
                              {att.pct}%
                            </div>
                            {att.presentDays != null && att.totalDays != null && (
                              <div style={{ fontSize:"11px", color:"#64748b", marginTop:"4px" }}>
                                {att.presentDays} / {att.totalDays} days
                              </div>
                            )}
                            <div className="att-pill" style={{
                              background: parseFloat(att.pct) >= 75 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                              color: parseFloat(att.pct) >= 75 ? "#4ade80" : "#f87171",
                              border:`1px solid ${parseFloat(att.pct) >= 75 ? "#4ade80" : "#f87171"}`,
                            }}>
                              {parseFloat(att.pct) >= 75 ? "✓ Eligible" : "⚠ Shortage"}
                            </div>
                          </div>
                        ) : (
                          <div className="sem-info-cell" style={{ opacity:0.5 }}>
                            <div className="sem-info-label">Attendance</div>
                            <div style={{ fontSize:"14px", color:"#64748b", marginTop:"6px" }}>Not recorded</div>
                          </div>
                        )}

                        {/* Fail subjects in this sem */}
                        <div className="sem-info-cell" style={{
                          border: activeSem.subjects.filter(s=>s.grade==="F").length > 0
                            ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(56,189,248,0.18)",
                        }}>
                          <div className="sem-info-label">Arrears This Sem</div>
                          <div className="sem-info-value" style={{
                            color: activeSem.subjects.filter(s=>s.grade==="F").length > 0 ? "#f87171" : "#34d399"
                          }}>
                            {activeSem.subjects.filter(s=>s.grade==="F").length}
                          </div>
                          <div style={{ fontSize:"11px", color:"#64748b", marginTop:"4px" }}>
                            {activeSem.subjects.filter(s=>s.grade==="F").length > 0 ? "Need to clear" : "No arrears"}
                          </div>
                        </div>

                      </div>

                      {/* Grade Points Chart */}
                      <div className="chart-container" style={{ marginBottom:"24px" }}>
                        <p style={{ color:"#94a3b8", marginBottom:"12px", fontSize:"14px" }}>Grade Points per Subject</p>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart
                            data={activeSem.subjects.map(s => ({ name: s.subject_name, GP: Number(s.grade_points), grade: s.grade }))}
                            barCategoryGap="40%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:11 }} />
                            <YAxis domain={[0, 10]} tick={{ fill:"#94a3b8" }} />
                            <Tooltip
                              contentStyle={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"8px" }}
                              labelStyle={{ color:"#e2e8f0", fontWeight:600 }}
                              itemStyle={{ color:"#94a3b8" }}
                              wrapperStyle={{ outline:"none" }}
                              cursor={{ fill:"rgba(255,255,255,0.05)" }}
                              formatter={(val, name, props) => [val, `Grade: ${props.payload.grade}`]}/>
                            <Bar dataKey="GP" radius={[3,3,0,0]} barSize={16}>
                              {activeSem.subjects.map(s => (
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
                            <p>Marks: <strong style={{ color:"#e2e8f0" }}>{s.marks_scored}</strong></p>
                            <p>Grade:
                              <strong style={{ marginLeft:"6px", color: GRADE_COLOR[s.grade] || "#38bdf8", fontSize:"18px" }}>
                                {s.grade}
                              </strong>
                            </p>
                            <p>Grade Points: <strong style={{ color:"#38bdf8" }}>{s.grade_points}</strong></p>
                            <p>Credits: <strong style={{ color:"#e2e8f0" }}>{s.credits}</strong></p>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8" }}>
                <p style={{ fontSize:"18px" }}>No marks available yet.</p>
                <p style={{ fontSize:"14px", marginTop:"8px" }}>Your marks will appear here once your mentor adds them.</p>
              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;