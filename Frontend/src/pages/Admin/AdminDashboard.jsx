import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GradeIcon from "@mui/icons-material/Grade";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

const GRADE_COLOR = {
  O: "#16a34a", "A+": "#2563eb", A: "#0891b2",
  "B+": "#7c3aed", B: "#d97706", C: "#ea580c", F: "#dc2626",
};

const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];

const menuItems = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  { label: "Students",  icon: <PeopleIcon />    },
  { label: "Subjects",  icon: <MenuBookIcon />  },
  { label: "Marks",     icon: <GradeIcon />     },
];

// ── helper to always read a fresh token ──────────────────────────────
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab,           setActiveTab]           = useState("Dashboard");
  const [loading,             setLoading]             = useState(true);
  const [students,            setStudents]            = useState([]);
  const [subjects,            setSubjects]            = useState([]);
  const [marks,               setMarks]               = useState([]);

  const [newSubject,          setNewSubject]          = useState("");
  const [newCredits,          setNewCredits]          = useState("");
  const [newStudentName,      setNewStudentName]      = useState("");
  const [newStudentEmail,     setNewStudentEmail]     = useState("");
  const [newStudentRollno,    setNewStudentRollno]    = useState("");
  const [newStudentPassword,  setNewStudentPassword]  = useState("");

  const [rollnoInput,         setRollnoInput]         = useState("");
  const [foundStudent,        setFoundStudent]        = useState(null);
  const [rollnoError,         setRollnoError]         = useState("");
  const [rollnoLoading,       setRollnoLoading]       = useState(false);
  const [selectedSubject,     setSelectedSubject]     = useState("");
  const [marksScored,         setMarksScored]         = useState("");
  const [semester,            setSemester]            = useState("");
  const [marksResult,         setMarksResult]         = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchSubjects(), fetchMarks()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res  = await fetch("http://localhost:5000/students", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchStudents:", err); }
  };

  const fetchSubjects = async () => {
    try {
      const res  = await fetch("http://localhost:5000/subjects", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchSubjects:", err); }
  };

  const fetchMarks = async () => {
    try {
      const res  = await fetch("http://localhost:5000/all-marks", { headers: getAuthHeader() });
      if (!res.ok) {
        console.error("fetchMarks failed:", res.status, await res.text());
        return;
      }
      const data = await res.json();
      console.log("Marks fetched:", data); // debug — remove after confirming
      setMarks(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchMarks:", err); }
  };

  const handleRollnoLookup = async (rollno) => {
    setRollnoInput(rollno);
    setFoundStudent(null);
    setRollnoError("");
    if (rollno.trim().length < 2) return;
    setRollnoLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/students", { headers: getAuthHeader() });
      const data = await res.json();
      const match = data.find((s) => s.rollno.toLowerCase() === rollno.trim().toLowerCase());
      if (match) { setFoundStudent(match); setRollnoError(""); }
      else        { setFoundStudent(null); setRollnoError("No student found with this roll number"); }
    } catch { setRollnoError("Error looking up student"); }
    finally { setRollnoLoading(false); }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentRollno || !newStudentEmail || !newStudentPassword) {
      alert("Please fill all fields"); return;
    }
    try {
      const res  = await fetch("http://localhost:5000/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ name: newStudentName, rollno: newStudentRollno, email: newStudentEmail, password: newStudentPassword }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setNewStudentName(""); setNewStudentRollno(""); setNewStudentEmail(""); setNewStudentPassword("");
      await fetchStudents();
      alert("Student Added Successfully");
    } catch { alert("Error adding student"); }
  };

  const handleAddSubject = async () => {
    if (!newSubject || !newCredits) { alert("Enter subject name and credits"); return; }
    try {
      const res  = await fetch("http://localhost:5000/add-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ subject_name: newSubject, credits: Number(newCredits) }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setNewSubject(""); setNewCredits("");
      await fetchSubjects();
      alert("Subject Added Successfully");
    } catch { alert("Error adding subject"); }
  };

  const handleAddMarks = async () => {
    if (!foundStudent || !selectedSubject || !marksScored || !semester) {
      alert("Please fill all fields and verify roll number"); return;
    }
    const m = Number(marksScored);
    if (m < 0 || m > 100) { alert("Marks must be between 0 and 100"); return; }
    try {
      const res  = await fetch("http://localhost:5000/add-marks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ student_id: foundStudent.id, subject_id: selectedSubject, marks_scored: m, semester }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setMarksResult({ ...data, semester });
      setRollnoInput(""); setFoundStudent(null); setRollnoError("");
      setMarksScored(""); setSemester(""); setSelectedSubject("");
      await fetchMarks();
    } catch { alert("Error adding marks"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  if (loading) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  const inputStyle = {
    width: "100%", padding: "11px 14px", fontSize: "15px", borderRadius: "8px",
    border: "1px solid #cbd5e1", outline: "none", marginBottom: "14px",
    boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
  };
  const btnStyle = {
    width: "100%", padding: "12px",
    background: "linear-gradient(90deg,#1e3c72,#2a5298)",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "15px", fontWeight: 600, cursor: "pointer",
  };

  return (
    <>
      {/* ✅ Force page to scroll naturally — overrides MUI CssBaseline */}
      <style>{`
        html, body, #root {
          height: auto !important;
          overflow-y: auto !important;
          overflow-x: hidden;
        }
      `}</style>

      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <CssBaseline />

        {/* ── AppBar ── */}
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            background: "linear-gradient(90deg,#1e3c72,#2a5298)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>{activeTab}</Typography>
          </Toolbar>
        </AppBar>

        {/* ── Permanent Drawer ── */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              background: "linear-gradient(180deg,#1e3c72,#2a5298)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <Toolbar sx={{ justifyContent: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
              SLEA Admin
            </Typography>
          </Toolbar>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

          <List sx={{ mt: 1, flexGrow: 1 }}>
            {menuItems.map(({ label, icon }) => (
              <ListItem key={label} disablePadding>
                <ListItemButton
                  onClick={() => setActiveTab(label)}
                  sx={{
                    mx: 1.5, my: 0.5, borderRadius: "10px",
                    background: activeTab === label
                      ? "linear-gradient(90deg,#ffffff,#e0e7ff)"
                      : "transparent",
                    color: activeTab === label ? "#1e3c72" : "#fff",
                    "&:hover": { background: "rgba(255,255,255,0.15)", color: "#fff" },
                    transition: "all 0.2s",
                  }}
                >
                  <ListItemIcon sx={{ color: activeTab === label ? "#1e3c72" : "#fff", minWidth: 40 }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontWeight: activeTab === label ? 700 : 400, fontSize: "15px" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  mx: 1.5, my: 0.5, borderRadius: "10px", color: "#fff",
                  "&:hover": { background: "rgba(239,68,68,0.35)" },
                }}
              >
                <ListItemIcon sx={{ color: "#fff", minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "15px" }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* ── Main Content ── */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "#f4f6f9",
            minHeight: "100vh",
            p: 4,
            boxSizing: "border-box",
          }}
        >
          <Toolbar />  {/* spacer for fixed AppBar */}

          {/* ════ DASHBOARD ════════════════════════════════════════ */}
          {activeTab === "Dashboard" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>
                Admin Overview
              </Typography>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {[
                  { label: "Total Students",     value: students.length, color: "#2563eb" },
                  { label: "Total Subjects",      value: subjects.length, color: "#16a34a" },
                  { label: "Total Marks Entries", value: marks.length,    color: "#d97706" },
                ].map(({ label, value, color }) => (
                  <Box
                    key={label}
                    sx={{
                      flex: "1 1 180px", background: "#fff", borderRadius: "12px",
                      p: "24px", textAlign: "center",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
                      borderTop: `4px solid ${color}`,
                    }}
                  >
                    <Typography sx={{ fontSize: "14px", color: "#64748b", mb: 1 }}>{label}</Typography>
                    <Typography sx={{ fontSize: "34px", fontWeight: 700, color }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* ════ STUDENTS ════════════════════════════════════════ */}
          {activeTab === "Students" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>Add Student</Typography>
              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 480, mb: 4 }}>
                <input style={inputStyle} placeholder="Student Name"  value={newStudentName}     onChange={(e) => setNewStudentName(e.target.value)} />
                <input style={inputStyle} placeholder="Email"         value={newStudentEmail}    onChange={(e) => setNewStudentEmail(e.target.value)} />
                <input style={inputStyle} placeholder="Roll Number"   value={newStudentRollno}   onChange={(e) => setNewStudentRollno(e.target.value)} />
                <input style={inputStyle} type="password" placeholder="Password" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
                <button style={btnStyle} onClick={handleAddStudent}>Add Student</button>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
                All Students ({students.length})
              </Typography>
              <Box sx={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", overflowX: "auto", mb: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1e293b", color: "#fff" }}>
                      {["#","Name","Roll No","Email"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{s.rollno}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{s.email}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No students yet</td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ════ SUBJECTS ════════════════════════════════════════ */}
          {activeTab === "Subjects" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>Add Subject</Typography>
              <Box sx={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "8px", p: "10px 16px", mb: 2, fontSize: "14px", color: "#1d4ed8" }}>
                📌 Subjects you add will only be visible to your department students.
              </Box>
              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 480, mb: 4 }}>
                <input style={inputStyle} placeholder="Subject Name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                <input style={inputStyle} type="number" placeholder="Credits (e.g. 3)" min="1" max="5" value={newCredits} onChange={(e) => setNewCredits(e.target.value)} />
                <button style={btnStyle} onClick={handleAddSubject}>Add Subject</button>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
                Your Department Subjects ({subjects.length})
              </Typography>
              <Box sx={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", overflowX: "auto", mb: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1e293b", color: "#fff" }}>
                      {["#","Subject Name","Credits","Department"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub, i) => (
                      <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{sub.subject_name}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 10px", borderRadius: "20px", fontSize: "13px" }}>
                            {sub.credits} credits
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "#2563eb", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" }}>
                            {sub.department}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No subjects yet</td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ════ MARKS ════════════════════════════════════════════ */}
          {activeTab === "Marks" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>Add Marks</Typography>

              {/* Grade Reference */}
              <Box sx={{ background: "#fff", borderRadius: "10px", p: 2, mb: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Typography sx={{ fontWeight: 600, mb: 1.5, color: "#475569", fontSize: "14px" }}>📊 Grade Reference</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {[
                    { range:"91–100", grade:"O",  pts:10 },
                    { range:"81–90",  grade:"A+", pts:9  },
                    { range:"71–80",  grade:"A",  pts:8  },
                    { range:"61–70",  grade:"B+", pts:7  },
                    { range:"56–60",  grade:"B",  pts:6  },
                    { range:"51–55",  grade:"C",  pts:5  },
                    { range:"≤50",    grade:"F",  pts:0  },
                  ].map(({ range, grade, pts }) => (
                    <Box
                      key={grade}
                      sx={{
                        background: GRADE_COLOR[grade] + "18",
                        border: `1px solid ${GRADE_COLOR[grade]}`,
                        borderRadius: "8px", p: "6px 12px",
                        textAlign: "center", minWidth: "80px",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, color: GRADE_COLOR[grade], fontSize: "15px" }}>{grade}</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#64748b" }}>{range}</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#64748b" }}>{pts} pts</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Add Marks Form */}
              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 500, mb: 3 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#475569", mb: 0.8 }}>
                  Student Roll Number
                </Typography>
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <input
                    style={{
                      ...inputStyle,
                      marginBottom: 0,
                      border: foundStudent ? "2px solid #16a34a" : rollnoError ? "2px solid #dc2626" : "1px solid #cbd5e1",
                    }}
                    placeholder="Enter roll number (e.g. 21IT001)"
                    value={rollnoInput}
                    onChange={(e) => handleRollnoLookup(e.target.value)}
                  />
                  {rollnoLoading && (
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#94a3b8" }}>
                      Searching...
                    </span>
                  )}
                </div>

                {foundStudent && (
                  <Box sx={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", p: "10px 14px", mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <span style={{ fontSize: "20px" }}>✅</span>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: "#16a34a", fontSize: "15px" }}>{foundStudent.name}</Typography>
                      <Typography sx={{ color: "#64748b", fontSize: "13px" }}>Roll No: {foundStudent.rollno}</Typography>
                    </Box>
                  </Box>
                )}

                {rollnoError && (
                  <Box sx={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", p: "10px 14px", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ fontSize: "18px" }}>❌</span>
                    <Typography sx={{ color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>{rollnoError}</Typography>
                  </Box>
                )}

                <select style={inputStyle} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.subject_name} ({sub.credits} credits)</option>
                  ))}
                </select>

                <select style={inputStyle} value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Marks Scored (0–100)"
                  min="0" max="100"
                  value={marksScored}
                  onChange={(e) => setMarksScored(e.target.value)}
                />

                <button
                  style={{ ...btnStyle, opacity: foundStudent ? 1 : 0.5, cursor: foundStudent ? "pointer" : "not-allowed" }}
                  onClick={handleAddMarks}
                  disabled={!foundStudent}
                >
                  Add Marks
                </button>
              </Box>

              {/* Success result */}
              {marksResult && (
                <Box sx={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", p: 3, mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "16px", color: "#16a34a", mb: 1.5 }}>
                    ✅ Marks Added Successfully!
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {[
                      { label: "Grade",         val: marksResult.grade,       color: GRADE_COLOR[marksResult.grade] },
                      { label: "Grade Points",  val: marksResult.gradePoints, color: "#2563eb" },
                      { label: "Credits",       val: marksResult.credits,     color: "#7c3aed" },
                      { label: "Semester SGPA", val: marksResult.sgpa,        color: "#d97706" },
                    ].map(({ label, val, color }) => (
                      <Box key={label} sx={{ background: "#fff", borderRadius: "8px", p: "12px 20px", textAlign: "center", border: `2px solid ${color}` }}>
                        <Typography sx={{ fontSize: "22px", fontWeight: 700, color }}>{val}</Typography>
                        <Typography sx={{ fontSize: "12px", color: "#64748b" }}>{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: "13px", color: "#64748b", mt: 1.5 }}>
                    * SGPA updates as more subjects are added for {marksResult.semester}
                  </Typography>
                  <button
                    onClick={() => setMarksResult(null)}
                    style={{ marginTop: "10px", padding: "6px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  >
                    Dismiss
                  </button>
                </Box>
              )}

              {/* All Marks Table */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
                All Marks Entries ({marks.length})
              </Typography>
              <Box sx={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", overflowX: "auto", mb: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1e293b", color: "#fff" }}>
                      {["#","Student","Subject","Semester","Marks","Grade","Grade Pts","Credits"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, i) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{m.student_name}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{m.subject_name}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{m.semester}</td>
                        <td style={{ padding: "12px 16px" }}>{m.marks_scored}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            background: (GRADE_COLOR[m.grade] || "#64748b") + "20",
                            color: GRADE_COLOR[m.grade] || "#64748b",
                            padding: "2px 10px", borderRadius: "20px", fontWeight: 700,
                          }}>
                            {m.grade}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{m.grade_points}</td>
                        <td style={{ padding: "12px 16px" }}>{m.credits}</td>
                      </tr>
                    ))}
                    {marks.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>
                          No marks added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

        </Box>
      </Box>
    </>
  );
}

export default AdminDashboard;