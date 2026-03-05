import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const GRADE_COLOR = {
  O:"#16a34a","A+":"#2563eb",A:"#0891b2",
  "B+":"#7c3aed",B:"#d97706",C:"#ea580c",F:"#dc2626",
};

function StudentDashboard() {
  const navigate  = useNavigate();
  const studentId = localStorage.getItem("userId");
  const token     = localStorage.getItem("token");

  const [studentName,      setStudentName]      = useState("");
  const [cgpa,             setCgpa]             = useState("0.00");
  const [semesters,        setSemesters]        = useState([]);
  const [attendance,       setAttendance]       = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    if (!studentId || !token) { navigate("/"); return; }
    loadData();
  }, []);

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadData = async () => {
    try {
      await Promise.all([fetchMarks(), fetchStudent(), fetchAttendance()]);
    } finally { setLoading(false); }
  };

  const fetchMarks = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/student-marks/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setSemesters(data.semesters || []);
      setCgpa(data.cgpa || "0.00");
      if (data.semesters?.length > 0) setSelectedSemester(data.semesters[0].semester);
    } catch (err) { console.error("Marks error:", err); }
  };

  const fetchStudent = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/student/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setStudentName(data?.name || "Student");
    } catch (err) { console.error("Student error:", err); }
  };

  const fetchAttendance = async () => {
    try {
      const res  = await fetch(`http://localhost:5000/student-attendance/${studentId}`, { headers: authHeader });
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Attendance error:", err); }
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

  if (loading) return <div className="loading-container"><h2>Loading Dashboard...</h2></div>;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SLEA</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Main */}
      <div className="main-content">
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

        {/* ── Semester SGPA Overview Chart ── */}
        {semesters.length > 0 && (
          <>
            <h2 style={{ marginBottom:"12px" }}>Semester CGPA Overview</h2>
            <div className="chart-container" style={{ marginBottom:"30px" }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={semesters.map((s) => ({ name: s.semester, SGPA: parseFloat(s.sgpa) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:12 }} />
                  <YAxis domain={[0,10]} tick={{ fill:"#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"8px" }}
                    labelStyle={{ color:"#e2e8f0" }}
                    itemStyle={{ color:"#38bdf8" }}
                  />
                  <Bar dataKey="SGPA" radius={[6,6,0,0]}>
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
            <h2 style={{ marginBottom:"12px" }}>Semester Details</h2>

            {/* Tab buttons */}
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
              {semesters.map((s) => (
                <button
                  key={s.semester}
                  onClick={() => setSelectedSemester(s.semester)}
                  style={{
                    padding:"10px 20px",
                    borderRadius:"25px",
                    border:"none",
                    cursor:"pointer",
                    fontWeight:600,
                    fontSize:"14px",
                    background: selectedSemester === s.semester
                      ? "linear-gradient(90deg,#38bdf8,#2563eb)"
                      : "rgba(255,255,255,0.08)",
                    color: selectedSemester === s.semester ? "#fff" : "#94a3b8",
                    transition:"all 0.2s",
                  }}
                >
                  {s.semester}
                  <span style={{ marginLeft:"8px", fontSize:"12px", opacity:0.85 }}>
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
                  background:"rgba(30,41,59,0.6)",
                  borderRadius:"12px",
                  padding:"20px 28px",
                  marginBottom:"20px",
                  border:"1px solid rgba(56,189,248,0.3)",
                  display:"flex", alignItems:"center", gap:"30px", flexWrap:"wrap",
                }}>
                  <div>
                    <p style={{ color:"#94a3b8", fontSize:"13px" }}>Semester</p>
                    <p style={{ color:"#e2e8f0", fontWeight:700, fontSize:"20px" }}>{activeSem.semester}</p>
                  </div>
                  <div>
                    <p style={{ color:"#94a3b8", fontSize:"13px" }}>SGPA</p>
                    <p style={{ color:"#38bdf8", fontWeight:700, fontSize:"32px" }}>{activeSem.sgpa}</p>
                  </div>
                  <div>
                    <p style={{ color:"#94a3b8", fontSize:"13px" }}>Subjects</p>
                    <p style={{ color:"#e2e8f0", fontWeight:700, fontSize:"20px" }}>{activeSem.subjects.length}</p>
                  </div>
                  <div>
                    <p style={{ color:"#94a3b8", fontSize:"13px" }}>Total Credits</p>
                    <p style={{ color:"#e2e8f0", fontWeight:700, fontSize:"20px" }}>
                      {activeSem.subjects.reduce((sum, s) => sum + Number(s.credits), 0)}
                    </p>
                  </div>
                </div>

                {/* Per-subject grade chart */}
                <div className="chart-container" style={{ marginBottom:"24px" }}>
                  <p style={{ color:"#94a3b8", marginBottom:"12px", fontSize:"14px" }}>Grade Points per Subject</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={activeSem.subjects.map((s) => ({
                      name: s.subject_name,
                      GP: Number(s.grade_points),
                      grade: s.grade,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:11 }} />
                      <YAxis domain={[0,10]} tick={{ fill:"#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"8px" }}
                        labelStyle={{ color:"#e2e8f0" }}
                        formatter={(val, name, props) => [val, `Grade: ${props.payload.grade}`]}
                      />
                      <Bar dataKey="GP" radius={[6,6,0,0]}>
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
            )}
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8" }}>
            <p style={{ fontSize:"18px" }}>No marks available yet.</p>
            <p style={{ fontSize:"14px", marginTop:"8px" }}>Your marks will appear here once your mentor adds them.</p>
          </div>
        )}

        {/* ── Attendance ── */}
        <h2 style={{ marginTop:"30px", marginBottom:"16px" }}>Attendance</h2>
        {attendance.length > 0 ? (
          <div className="cards">
            {attendance.map((att, i) => (
              <div key={i} className="card">
                <h3>{att.subject_name}</h3>
                <p>Attendance:
                  <strong style={{ marginLeft:"6px", color: att.attendance_percentage >= 75 ? "#16a34a" : "#dc2626", fontSize:"18px" }}>
                    {att.attendance_percentage}%
                  </strong>
                </p>
                <p>Semester: <strong style={{ color:"#e2e8f0" }}>{att.semester}</strong></p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color:"#94a3b8" }}>No attendance data available.</p>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;





