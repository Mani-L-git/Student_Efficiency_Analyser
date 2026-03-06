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
import IconButton from "@mui/material/IconButton";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GradeIcon from "@mui/icons-material/Grade";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const GRADE_COLOR = {
  O: "#16a34a", "A+": "#2563eb", A: "#0891b2",
  "B+": "#7c3aed", B: "#d97706", C: "#ea580c", F: "#dc2626",
};

const SEMESTERS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];

const menuItems = [
  { label: "Dashboard",     icon: <DashboardIcon />      },
  { label: "Students",      icon: <PeopleIcon />         },
  { label: "Subjects",      icon: <MenuBookIcon />       },
  { label: "Marks",         icon: <GradeIcon />          },
  { label: "Attendance",    icon: <EventAvailableIcon /> },
  { label: "Efficiency",    icon: <EmojiEventsIcon />    },
  { label: "Announcements", icon: <AnnouncementIcon />   },
];

/* ─────────────────────────────────────────
   AUTH HELPER
───────────────────────────────────────── */
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
function AdminDashboard() {
  const navigate = useNavigate();

  // ── Tab ─────────────────────────────────
  const [activeTab, setActiveTab] = useState("Dashboard");

  // ── Loading ──────────────────────────────
  const [loading, setLoading] = useState(true);

  // ── Data ─────────────────────────────────
  const [students,  setStudents]  = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [marks,     setMarks]     = useState([]);
  const [attendance, setAttendance] = useState([]);          // ✅ NEW
  const [announcements, setAnnouncements] = useState([]);   // ✅ NEW
  const [replies,   setReplies]   = useState({});            // ✅ NEW { annId: [] }

  // ── Student form ─────────────────────────
  const [newStudentName,     setNewStudentName]     = useState("");
  const [newStudentEmail,    setNewStudentEmail]    = useState("");
  const [newStudentRollno,   setNewStudentRollno]   = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");

  // ── Subject form ─────────────────────────
  const [newSubject,  setNewSubject]  = useState("");
  const [newCredits,  setNewCredits]  = useState("");

  // ── Marks form ───────────────────────────
  const [rollnoInput,     setRollnoInput]     = useState("");
  const [foundStudent,    setFoundStudent]    = useState(null);
  const [rollnoError,     setRollnoError]     = useState("");
  const [rollnoLoading,   setRollnoLoading]   = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marksScored,     setMarksScored]     = useState("");
  const [semester,        setSemester]        = useState("");
  const [marksResult,     setMarksResult]     = useState(null);

  // ── Attendance form ──────────────────────  ✅ NEW
  const [attRollno,       setAttRollno]       = useState("");
  const [attStudent,      setAttStudent]      = useState(null);
  const [attRollnoError,  setAttRollnoError]  = useState("");
  const [attSubject,      setAttSubject]      = useState("");
  const [attSemester,     setAttSemester]     = useState("");
  const [presentDays,     setPresentDays]     = useState("");
  const [totalDays,       setTotalDays]       = useState("");
  const [attMsg,          setAttMsg]          = useState("");

  // ── Announcement form ──────────────────────
  const [annTitle,    setAnnTitle]    = useState("");
  const [annMessage,  setAnnMessage]  = useState("");
  const [replyText,   setReplyText]   = useState({});
  const [isListening, setIsListening] = useState(null);

  // ── Efficiency form ─────────────────────────
  const [effRollno,     setEffRollno]     = useState("");
  const [effStudent,    setEffStudent]    = useState(null);
  const [effRollnoErr,  setEffRollnoErr]  = useState("");
  const [effRollnoLoad, setEffRollnoLoad] = useState(false);
  const [skillLevel,    setSkillLevel]    = useState("");
  const [actType,       setActType]       = useState("");
  const [actDesc,       setActDesc]       = useState("");
  const [achName,       setAchName]       = useState("");
  const [achPoints,     setAchPoints]     = useState("");
  const [effData,       setEffData]       = useState(null);
  const [effScore,      setEffScore]      = useState(null);
  const [effMsg,        setEffMsg]        = useState("");

  /* ─────────────────────────────────────
     INIT
  ───────────────────────────────────── */
  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchAll();
  }, []);

  // Auto-reload efficiency data when effStudent changes
  useEffect(() => {
    if (effStudent) {
      loadEffData(effStudent.id);
      loadEffScore(effStudent.id);
    }
  }, [effStudent]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStudents(),
        fetchSubjects(),
        fetchMarks(),
        fetchAttendanceList(),
        fetchAnnouncements(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────
     FETCH HELPERS
  ───────────────────────────────────── */
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
      if (!res.ok) return;
      const data = await res.json();
      setMarks(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchMarks:", err); }
  };

  /* ✅ NEW: fetch attendance list for admin's dept */
  const fetchAttendanceList = async () => {
    try {
      const res  = await fetch("http://localhost:5000/attendance-list", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchAttendance:", err); }
  };

  /* ✅ NEW: fetch announcements */
  const fetchAnnouncements = async () => {
    try {
      const res  = await fetch("http://localhost:5000/announcements", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAnnouncements(list);
      for (const ann of list) fetchReplies(ann.id);
    } catch (err) { console.error("fetchAnnouncements:", err); }
  };

  /* ✅ NEW: fetch replies for one announcement */
  const fetchReplies = async (annId) => {
    try {
      const res  = await fetch(`http://localhost:5000/announcement/${annId}/replies`, { headers: getAuthHeader() });
      const data = await res.json();
      setReplies(prev => ({ ...prev, [annId]: Array.isArray(data) ? data : [] }));
    } catch (err) { console.error("fetchReplies:", err); }
  };

  /* ─────────────────────────────────────
     ROLL-NO LOOKUP (shared helper)
  ───────────────────────────────────── */
  const lookupRollno = async (rollno, setStudent, setError, setLoadingFn) => {
    setStudent(null); setError("");
    if (rollno.trim().length < 2) return;
    setLoadingFn(true);
    try {
      const res  = await fetch("http://localhost:5000/students", { headers: getAuthHeader() });
      const data = await res.json();
      const match = data.find((s) => s.rollno.toLowerCase() === rollno.trim().toLowerCase());
      if (match) { setStudent(match); setError(""); }
      else        { setStudent(null); setError("No student found with this roll number"); }
    } catch { setError("Error looking up student"); }
    finally { setLoadingFn(false); }
  };

  /* ─────────────────────────────────────
     STUDENT ACTIONS
  ───────────────────────────────────── */
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

  /* ✅ NEW: delete student */
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Remove this student? All their marks and attendance will also be deleted.")) return;
    try {
      const res = await fetch(`http://localhost:5000/student/${id}`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) { alert("Failed to delete student"); return; }
      await fetchStudents();
      await fetchMarks();
    } catch { alert("Error deleting student"); }
  };

  /* ─────────────────────────────────────
     SUBJECT ACTIONS
  ───────────────────────────────────── */
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

  /* ✅ NEW: delete subject */
  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Delete this subject? All marks linked to it will also be removed.")) return;
    try {
      const res = await fetch(`http://localhost:5000/subject/${id}`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) { alert("Failed to delete subject"); return; }
      await fetchSubjects();
      await fetchMarks();
    } catch { alert("Error deleting subject"); }
  };

  /* ─────────────────────────────────────
     MARKS ACTIONS
  ───────────────────────────────────── */
  const handleRollnoLookup = (rollno) => {
    setRollnoInput(rollno);
    lookupRollno(rollno, setFoundStudent, setRollnoError, setRollnoLoading);
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

  /* ✅ NEW: delete mark entry */
  const handleDeleteMark = async (id) => {
    if (!window.confirm("Delete this mark entry?")) return;
    try {
      const res = await fetch(`http://localhost:5000/mark/${id}`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) { alert("Failed to delete mark"); return; }
      await fetchMarks();
    } catch { alert("Error deleting mark"); }
  };

  /* ─────────────────────────────────────
     ✅ NEW: ATTENDANCE ACTIONS
  ───────────────────────────────────── */
  const [attRollnoLoading, setAttRollnoLoading] = useState(false);

  const handleAttRollnoLookup = (rollno) => {
    setAttRollno(rollno);
    lookupRollno(rollno, setAttStudent, setAttRollnoError, setAttRollnoLoading);
  };

  const handleAddAttendance = async () => {
    if (!attStudent || !attSubject || !attSemester || !presentDays || !totalDays) {
      setAttMsg("❌ Please fill all fields and verify roll number"); return;
    }
    const p = Number(presentDays), t = Number(totalDays);
    if (p > t) { setAttMsg("❌ Present days cannot exceed total days"); return; }
    try {
      const res = await fetch("http://localhost:5000/add-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          student_id: attStudent.id,
          subject_id: attSubject,
          semester:   attSemester,
          present_days: p,
          total_days:   t,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAttMsg(`❌ ${data.message}`); return; }
      setAttMsg(`✅ Attendance saved — ${((p / t) * 100).toFixed(1)}%`);
      setAttRollno(""); setAttStudent(null); setAttSubject(""); setAttSemester("");
      setPresentDays(""); setTotalDays("");
      await fetchAttendanceList();
    } catch { setAttMsg("❌ Error saving attendance"); }
  };

  /* ─────────────────────────────────────
     ✅ NEW: ANNOUNCEMENT ACTIONS
  ───────────────────────────────────── */
  const handlePostAnnouncement = async () => {
    if (!annTitle || !annMessage) { alert("Title and message required"); return; }
    try {
      const res = await fetch("http://localhost:5000/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ title: annTitle, message: annMessage }),
      });
      if (!res.ok) { alert("Failed to post announcement"); return; }
      setAnnTitle(""); setAnnMessage("");
      await fetchAnnouncements();
    } catch { alert("Error posting announcement"); }
  };

  /* ✅ NEW: Voice reply */
  const startVoice = (annId) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported. Use Chrome or Edge.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    setIsListening(annId);
    rec.onresult = (e) => {
      setReplyText(prev => ({ ...prev, [annId]: e.results[0][0].transcript }));
      setIsListening(null);
    };
    rec.onerror = () => setIsListening(null);
    rec.onend   = () => setIsListening(null);
    rec.start();
  };

  /* ✅ NEW: Submit reply */
  const submitReply = async (annId, isVoice = false) => {
    const text = (replyText[annId] || "").trim();
    if (!text) return;
    try {
      const res = await fetch(`http://localhost:5000/announcement/${annId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ reply_text: text, is_voice: isVoice }),
      });
      if (!res.ok) return;
      setReplyText(prev => ({ ...prev, [annId]: "" }));
      fetchReplies(annId);
    } catch (err) { console.error("Reply error:", err); }
  };

  /* ─────────────────────────────────────
     EFFICIENCY ACTIONS
  ───────────────────────────────────── */
  const handleEffRollnoLookup = (rollno) => {
    setEffRollno(rollno);
    setEffData(null); setEffScore(null);
    lookupRollno(rollno, setEffStudent, setEffRollnoErr, setEffRollnoLoad);
  };

  const loadEffData = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/student-efficiency-data/${studentId}`, { headers: getAuthHeader() });
      if (!res.ok) return;
      setEffData(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadEffScore = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:5000/efficiency/${studentId}`, { headers: getAuthHeader() });
      if (!res.ok) return;
      setEffScore(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleSetSkill = async () => {
    if (!effStudent || !skillLevel) { setEffMsg("❌ Select student and skill level"); return; }
    try {
      const res = await fetch("http://localhost:5000/admin/student-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ student_id: effStudent.id, skill_level: skillLevel }),
      });
      const d = await res.json();
      if (!res.ok) { setEffMsg(`❌ ${d.message}`); return; }
      setEffMsg(`✅ Skill set to ${skillLevel} — ${d.skill_score} pts`);
      loadEffData(effStudent.id); loadEffScore(effStudent.id);
    } catch { setEffMsg("❌ Server error"); }
  };

  const handleAddActivity = async () => {
    if (!effStudent || !actType) { setEffMsg("❌ Select student and activity type"); return; }
    try {
      const res = await fetch("http://localhost:5000/admin/student-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ student_id: effStudent.id, activity_type: actType, description: actDesc }),
      });
      const d = await res.json();
      if (!res.ok) { setEffMsg(`❌ ${d.message}`); return; }
      setEffMsg(`✅ ${d.message}`);
      setActType(""); setActDesc("");
      loadEffData(effStudent.id); loadEffScore(effStudent.id);
    } catch { setEffMsg("❌ Server error"); }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await fetch(`http://localhost:5000/admin/student-activity/${id}`, { method: "DELETE", headers: getAuthHeader() });
      loadEffData(effStudent.id); loadEffScore(effStudent.id);
    } catch (e) { console.error(e); }
  };

  const handleAddAchievement = async () => {
    if (!effStudent || !achName || !achPoints) { setEffMsg("❌ Fill all achievement fields"); return; }
    try {
      const res = await fetch("http://localhost:5000/admin/student-achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ student_id: effStudent.id, achievement_name: achName, points: Number(achPoints) }),
      });
      const d = await res.json();
      if (!res.ok) { setEffMsg(`❌ ${d.message}`); return; }
      setEffMsg("✅ Achievement added");
      setAchName(""); setAchPoints("");
      loadEffData(effStudent.id); loadEffScore(effStudent.id);
    } catch { setEffMsg("❌ Server error"); }
  };

  const handleDeleteAchievement = async (id) => {
    try {
      await fetch(`http://localhost:5000/admin/student-achievement/${id}`, { method: "DELETE", headers: getAuthHeader() });
      loadEffData(effStudent.id); loadEffScore(effStudent.id);
    } catch (e) { console.error(e); }
  };

  const bandColor = (band) =>
    band === "Excellent" ? "#16a34a" :
    band === "Good"      ? "#2563eb" :
    band === "Needs Improvement" ? "#d97706" : "#dc2626";

  /* ─────────────────────────────────────
     LOGOUT
  ───────────────────────────────────── */
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  /* ─────────────────────────────────────
     SHARED STYLES
  ───────────────────────────────────── */
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

  /* ─────────────────────────────────────
     LOADING SCREEN
  ───────────────────────────────────── */
  if (loading) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <>
      <style>{`
        html, body, #root { height: auto !important; overflow-y: auto !important; overflow-x: hidden; }
      `}</style>

      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <CssBaseline />

        {/* ══════════ AppBar ══════════ */}
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

        {/* ══════════ Drawer ══════════ */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth, flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth, boxSizing: "border-box",
              background: "linear-gradient(180deg,#1e3c72,#2a5298)",
              color: "#fff", display: "flex", flexDirection: "column",
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

        {/* ══════════ Main Content ══════════ */}
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: "#f4f6f9", minHeight: "100vh", p: 4, boxSizing: "border-box" }}
        >
          <Toolbar />

          {/* ════ DASHBOARD ════ */}
          {activeTab === "Dashboard" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>
                Admin Overview
              </Typography>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {[
                  { label: "Total Students",     value: students.length,  color: "#2563eb" },
                  { label: "Total Subjects",      value: subjects.length,  color: "#16a34a" },
                  { label: "Total Marks Entries", value: marks.length,     color: "#d97706" },
                  { label: "Announcements",       value: announcements.length, color: "#7c3aed" },
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{
                    flex: "1 1 180px", background: "#fff", borderRadius: "12px",
                    p: "24px", textAlign: "center",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
                    borderTop: `4px solid ${color}`,
                  }}>
                    <Typography sx={{ fontSize: "14px", color: "#64748b", mb: 1 }}>{label}</Typography>
                    <Typography sx={{ fontSize: "34px", fontWeight: 700, color }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* ════ STUDENTS ════ */}
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
                      {["#", "Name", "Roll No", "Email", "Action"].map((h) => (
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
                        {/* ✅ NEW: delete button */}
                        <td style={{ padding: "12px 16px" }}>
                          <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteStudent(s.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No students yet</td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ════ SUBJECTS ════ */}
          {activeTab === "Subjects" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>Add Subject</Typography>
              <Box sx={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "8px", p: "10px 16px", mb: 2, fontSize: "14px", color: "#1d4ed8" }}>
                📌 Subjects you add will only be visible to your department students.
              </Box>
              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 480, mb: 4 }}>
                <input style={inputStyle} placeholder="Subject Name"     value={newSubject}  onChange={(e) => setNewSubject(e.target.value)} />
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
                      {["#", "Subject Name", "Credits", "Department", "Action"].map((h) => (
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
                        {/* ✅ NEW: delete button */}
                        <td style={{ padding: "12px 16px" }}>
                          <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteSubject(sub.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No subjects yet</td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ════ MARKS ════ */}
          {activeTab === "Marks" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>Add Marks</Typography>

              {/* Grade Reference */}
              <Box sx={{ background: "#fff", borderRadius: "10px", p: 2, mb: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Typography sx={{ fontWeight: 600, mb: 1.5, color: "#475569", fontSize: "14px" }}>📊 Grade Reference</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {[
                    { range: "91–100", grade: "O",  pts: 10 },
                    { range: "81–90",  grade: "A+", pts: 9  },
                    { range: "71–80",  grade: "A",  pts: 8  },
                    { range: "61–70",  grade: "B+", pts: 7  },
                    { range: "56–60",  grade: "B",  pts: 6  },
                    { range: "51–55",  grade: "C",  pts: 5  },
                    { range: "≤50",    grade: "F",  pts: 0  },
                  ].map(({ range, grade, pts }) => (
                    <Box key={grade} sx={{
                      background: GRADE_COLOR[grade] + "18", border: `1px solid ${GRADE_COLOR[grade]}`,
                      borderRadius: "8px", p: "6px 12px", textAlign: "center", minWidth: "80px",
                    }}>
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
                      ...inputStyle, marginBottom: 0,
                      border: foundStudent ? "2px solid #16a34a" : rollnoError ? "2px solid #dc2626" : "1px solid #cbd5e1",
                    }}
                    placeholder="Enter roll number (e.g. 21IT001)"
                    value={rollnoInput}
                    onChange={(e) => handleRollnoLookup(e.target.value)}
                  />
                  {rollnoLoading && (
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#94a3b8" }}>
                      Searching…
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
                  <Box sx={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", p: "10px 14px", mb: 2 }}>
                    <Typography sx={{ color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>❌ {rollnoError}</Typography>
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
                  style={inputStyle} type="number"
                  placeholder="Marks Scored (0–100)" min="0" max="100"
                  value={marksScored} onChange={(e) => setMarksScored(e.target.value)}
                />
                <button
                  style={{ ...btnStyle, opacity: foundStudent ? 1 : 0.5, cursor: foundStudent ? "pointer" : "not-allowed" }}
                  onClick={handleAddMarks} disabled={!foundStudent}
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
                  <button onClick={() => setMarksResult(null)} style={{ marginTop: "10px", padding: "6px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Dismiss
                  </button>
                </Box>
              )}

              {/* All Marks Table with ✅ DELETE */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
                All Marks Entries ({marks.length})
              </Typography>
              <Box sx={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", overflowX: "auto", mb: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1e293b", color: "#fff" }}>
                      {["#", "Student", "Subject", "Semester", "Marks", "Grade", "Grade Pts", "Credits", "Action"].map((h) => (
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
                          <span style={{ background: (GRADE_COLOR[m.grade] || "#64748b") + "20", color: GRADE_COLOR[m.grade] || "#64748b", padding: "2px 10px", borderRadius: "20px", fontWeight: 700 }}>
                            {m.grade}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{m.grade_points}</td>
                        <td style={{ padding: "12px 16px" }}>{m.credits}</td>
                        {/* ✅ NEW: delete button */}
                        <td style={{ padding: "12px 16px" }}>
                          <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteMark(m.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                    {marks.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: "15px" }}>No marks added yet</td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ════ ATTENDANCE (✅ NEW TAB) ════ */}
          {activeTab === "Attendance" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>
                Add / Update Attendance
              </Typography>

              {attMsg && (
                <Box sx={{
                  p: "10px 16px", mb: 2, borderRadius: "8px",
                  background: attMsg.startsWith("✅") ? "#dcfce7" : "#fee2e2",
                  color:      attMsg.startsWith("✅") ? "#16a34a" : "#dc2626",
                  fontWeight: 500,
                }}>
                  {attMsg}
                </Box>
              )}

              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 500, mb: 4 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#475569", mb: 0.8 }}>
                  Student Roll Number
                </Typography>
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <input
                    style={{
                      ...inputStyle, marginBottom: 0,
                      border: attStudent ? "2px solid #16a34a" : attRollnoError ? "2px solid #dc2626" : "1px solid #cbd5e1",
                    }}
                    placeholder="Enter roll number"
                    value={attRollno}
                    onChange={(e) => handleAttRollnoLookup(e.target.value)}
                  />
                  {attRollnoLoading && (
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#94a3b8" }}>
                      Searching…
                    </span>
                  )}
                </div>

                {attStudent && (
                  <Box sx={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", p: "10px 14px", mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: "#16a34a" }}>✅ {attStudent.name}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "13px" }}>Roll: {attStudent.rollno}</Typography>
                  </Box>
                )}
                {attRollnoError && (
                  <Box sx={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", p: "10px 14px", mb: 2 }}>
                    <Typography sx={{ color: "#dc2626", fontSize: "13px" }}>❌ {attRollnoError}</Typography>
                  </Box>
                )}

                <select style={inputStyle} value={attSubject} onChange={(e) => setAttSubject(e.target.value)}>
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                  ))}
                </select>

                <select style={inputStyle} value={attSemester} onChange={(e) => setAttSemester(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Present & Total days side by side */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="number" min="0" placeholder="Present Days"
                    value={presentDays} onChange={(e) => setPresentDays(e.target.value)}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="number" min="1" placeholder="Total Days"
                    value={totalDays} onChange={(e) => setTotalDays(e.target.value)}
                  />
                </div>

                {/* Live percentage preview */}
                {presentDays && totalDays && Number(totalDays) > 0 && (
                  <Box sx={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", p: "10px 14px", mb: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "13px", color: "#64748b" }}>Attendance Preview</Typography>
                    <Typography sx={{
                      fontSize: "28px", fontWeight: 700,
                      color: ((Number(presentDays) / Number(totalDays)) * 100) >= 75 ? "#16a34a" : "#dc2626",
                    }}>
                      {((Number(presentDays) / Number(totalDays)) * 100).toFixed(1)}%
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#94a3b8" }}>
                      {((Number(presentDays) / Number(totalDays)) * 100) >= 75 ? "✓ Eligible" : "⚠ Below 75%"}
                    </Typography>
                  </Box>
                )}

                <button
                  style={{ ...btnStyle, opacity: attStudent ? 1 : 0.5, cursor: attStudent ? "pointer" : "not-allowed" }}
                  onClick={handleAddAttendance} disabled={!attStudent}
                >
                  Save Attendance
                </button>
              </Box>

              {/* Attendance list */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
                Attendance Records ({attendance.length})
              </Typography>
              <Box sx={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", overflowX: "auto", mb: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#1e293b", color: "#fff" }}>
                      {["#", "Student", "Subject", "Semester", "Present", "Total", "Percentage"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, i) => {
                      const pct = a.present_days != null && a.total_days > 0
                        ? ((a.present_days / a.total_days) * 100).toFixed(1)
                        : Number(a.attendance_percentage || 0).toFixed(1);
                      const eligible = parseFloat(pct) >= 75;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i + 1}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 500 }}>{a.student_name || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{a.subject_name}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{a.semester}</td>
                          <td style={{ padding: "12px 16px" }}>{a.present_days ?? "—"}</td>
                          <td style={{ padding: "12px 16px" }}>{a.total_days ?? "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              fontWeight: 700, fontSize: "14px",
                              color: eligible ? "#16a34a" : "#dc2626",
                            }}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {attendance.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No attendance records yet</td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ════ EFFICIENCY TAB ════ */}
          {activeTab === "Efficiency" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#1e293b" }}>Student Efficiency Data</Typography>
              <Typography sx={{ color: "#64748b", mb: 3, fontSize: "14px" }}>
                Set skill level, add activities and achievements for a student — score updates instantly.
              </Typography>

              {effMsg && (
                <Box sx={{ p: "10px 16px", mb: 2, borderRadius: "8px", background: effMsg.startsWith("✅") ? "#dcfce7" : "#fee2e2", color: effMsg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 500 }}>
                  {effMsg}
                </Box>
              )}

              {/* Roll no lookup */}
              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 480, mb: 3 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#475569", mb: 0.8 }}>Student Roll Number</Typography>
                <input
                  style={{ ...inputStyle, marginBottom: "8px",
                    border: effStudent ? "2px solid #16a34a" : effRollnoErr ? "2px solid #dc2626" : "1px solid #cbd5e1" }}
                  placeholder="Enter roll number"
                  value={effRollno}
                  onChange={(e) => handleEffRollnoLookup(e.target.value)}
                />
                {effRollnoLoad && <Typography sx={{ fontSize: "12px", color: "#94a3b8", mb: 1 }}>Searching…</Typography>}
                {effStudent && (
                  <Box sx={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", p: "10px 14px", mt: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, color: "#16a34a" }}>✅ {effStudent.name}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "13px" }}>Roll: {effStudent.rollno}</Typography>
                  </Box>
                )}
                {effRollnoErr && (
                  <Box sx={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", p: "8px 14px", mt: 0.5 }}>
                    <Typography sx={{ color: "#dc2626", fontSize: "13px" }}>❌ {effRollnoErr}</Typography>
                  </Box>
                )}
              </Box>

              {effStudent && (
                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>

                  {/* LEFT: input forms */}
                  <Box sx={{ flex: "1 1 320px" }}>

                    {/* Skill Level */}
                    <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", mb: 3 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "15px", mb: 2 }}>🎯 Set Skill Level</Typography>
                      {effData?.skill && (
                        <Box sx={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", p: "8px 14px", mb: 1.5, fontSize: "13px" }}>
                          Current: <strong>{effData.skill.skill_level}</strong> ({effData.skill.skill_score} pts)
                        </Box>
                      )}
                      <select style={inputStyle} value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
                        <option value="">Select Skill Level</option>
                        <option value="Beginner">Beginner (25 pts)</option>
                        <option value="Intermediate">Intermediate (50 pts)</option>
                        <option value="Advanced">Advanced (75 pts)</option>
                        <option value="Expert">Expert (100 pts)</option>
                      </select>
                      <button style={btnStyle} onClick={handleSetSkill}>Save Skill Level</button>
                    </Box>

                    {/* Add Activity */}
                    <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", mb: 3 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "15px", mb: 2 }}>🏃 Add Activity</Typography>
                      <select style={inputStyle} value={actType} onChange={(e) => setActType(e.target.value)}>
                        <option value="">Select Activity Type</option>
                        <option value="Club">Club (10 pts)</option>
                        <option value="Workshop">Workshop (15 pts)</option>
                        <option value="NSS">NSS (20 pts)</option>
                        <option value="NCC">NCC (25 pts)</option>
                        <option value="Sports">Sports (15 pts)</option>
                        <option value="Leadership">Leadership (20 pts)</option>
                        <option value="Volunteering">Volunteering (15 pts)</option>
                      </select>
                      <input style={inputStyle} placeholder="Description (optional)" value={actDesc} onChange={(e) => setActDesc(e.target.value)} />
                      <button style={btnStyle} onClick={handleAddActivity}>Add Activity</button>
                      {(effData?.activities || []).length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          {effData.activities.map((act) => (
                            <Box key={act.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: "8px", p: "8px 12px", mb: 1 }}>
                              <Box>
                                <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>{act.activity_type}</Typography>
                                {act.description && <Typography sx={{ fontSize: "11px", color: "#64748b" }}>{act.description}</Typography>}
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <span style={{ background: "#dbeafe", color: "#2563eb", padding: "2px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>{act.points} pts</span>
                                <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteActivity(act.id)}><DeleteIcon fontSize="small" /></IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Add Achievement */}
                    <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", mb: 3 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "15px", mb: 2 }}>🏆 Add Achievement</Typography>
                      <input style={inputStyle} placeholder="Achievement Name (e.g. State Chess Winner)" value={achName} onChange={(e) => setAchName(e.target.value)} />
                      <input style={inputStyle} type="number" placeholder="Points (e.g. 20)" value={achPoints} onChange={(e) => setAchPoints(e.target.value)} />
                      <button style={btnStyle} onClick={handleAddAchievement}>Add Achievement</button>
                      {(effData?.achievements || []).length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          {effData.achievements.map((ach) => (
                            <Box key={ach.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: "8px", p: "8px 12px", mb: 1 }}>
                              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>{ach.achievement_name}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <span style={{ background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>{ach.points} pts</span>
                                <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteAchievement(ach.id)}><DeleteIcon fontSize="small" /></IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* RIGHT: Efficiency Score Card */}
                  {effScore && (
                    <Box sx={{ flex: "0 0 300px" }}>
                      <Box sx={{
                        background: "#fff", borderRadius: "16px", p: 3,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                        border: `3px solid ${bandColor(effScore.band)}`,
                        position: "sticky", top: "80px",
                      }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "15px", mb: 2, textAlign: "center" }}>📊 Efficiency Score</Typography>
                        <Box sx={{ textAlign: "center", mb: 3 }}>
                          <Typography sx={{ fontSize: "60px", fontWeight: 800, color: bandColor(effScore.band), lineHeight: 1 }}>
                            {effScore.finalScore}
                          </Typography>
                          <span style={{
                            display: "inline-block", marginTop: "8px",
                            padding: "4px 18px", borderRadius: "999px", fontWeight: 700, fontSize: "14px",
                            background: bandColor(effScore.band) + "20", color: bandColor(effScore.band),
                            border: `1px solid ${bandColor(effScore.band)}`,
                          }}>
                            {effScore.band}
                          </span>
                        </Box>
                        {[
                          { label: "Skills (30%)",       value: effScore.skillScore,       color: "#7c3aed" },
                          { label: "Achievements (20%)", value: effScore.achievementScore, color: "#d97706" },
                          { label: "Activities (20%)",   value: effScore.activityScore,    color: "#16a34a" },
                          { label: "SGPA (30%)",         value: effScore.sgpaScore,        color: "#2563eb" },
                        ].map(({ label, value, color }) => (
                          <Box key={label} sx={{ mb: 1.5 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                              <Typography sx={{ fontSize: "12px", color: "#64748b" }}>{label}</Typography>
                              <Typography sx={{ fontSize: "12px", fontWeight: 600, color }}>{value}/100</Typography>
                            </Box>
                            <Box sx={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${value}%`, background: color, borderRadius: "3px", transition: "width 0.8s ease" }} />
                            </Box>
                          </Box>
                        ))}
                        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                          <Typography sx={{ fontSize: "12px", color: "#64748b" }}>CGPA: <strong>{effScore.cgpa}</strong></Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                </Box>
              )}
            </Box>
          )}

          {/* ════ ANNOUNCEMENTS (✅ NEW TAB) ════ */}
          {activeTab === "Announcements" && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#1e293b" }}>
                Announcements
              </Typography>

              {/* Post form */}
              <Box sx={{ background: "#fff", borderRadius: "12px", p: 3, boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 520, mb: 4 }}>
                <Typography sx={{ fontWeight: 600, mb: 1.5, color: "#475569", fontSize: "14px" }}>
                  📢 Post to your department students
                </Typography>
                <input style={inputStyle} placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
                <textarea
                  style={{ ...inputStyle, height: "90px", resize: "vertical", marginBottom: "14px" }}
                  placeholder="Message…"
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                />
                <button style={btnStyle} onClick={handlePostAnnouncement}>Post Announcement</button>
              </Box>

              {/* Received announcements list */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#1e293b" }}>
                All Announcements ({announcements.length})
              </Typography>

              {announcements.length === 0 ? (
                <Typography sx={{ color: "#94a3b8" }}>No announcements yet.</Typography>
              ) : (
                announcements.map((ann) => (
                  <Box key={ann.id} sx={{
                    background: "#fff", borderRadius: "12px",
                    p: "20px 24px", mb: 2,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #2563eb",
                  }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{
                        fontSize: "11px", padding: "2px 10px", borderRadius: "999px",
                        background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5",
                        fontWeight: 600,
                      }}>
                        {ann.target === "all" ? "Super Admin → All" : ann.target + " Admin"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto" }}>
                        {ann.created_at ? new Date(ann.created_at).toLocaleString() : ""}
                      </span>
                    </div>

                    <Typography sx={{ fontWeight: 700, fontSize: "16px", mb: 0.5 }}>{ann.title}</Typography>
                    <Typography sx={{ color: "#475569", fontSize: "14px", mb: 1.5 }}>{ann.message}</Typography>

                    {/* Replies */}
                    {(replies[ann.id] || []).length > 0 && (
                      <Box sx={{ mb: 1.5, pl: 1.5, borderLeft: "2px solid #e2e8f0" }}>
                        {(replies[ann.id] || []).map((r, i) => (
                          <Box key={i} sx={{ background: "#f8fafc", borderRadius: "8px", p: "8px 12px", mb: 0.8 }}>
                            <Typography sx={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                              {r.user_name || "User"}
                              {r.is_voice === 1 && <span style={{ color: "#7c3aed", marginLeft: "6px", fontSize: "10px" }}>🎤 voice</span>}
                            </Typography>
                            <Typography sx={{ fontSize: "13px", color: "#475569" }}>{r.reply_text}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Reply input */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        style={{
                          flex: 1, padding: "9px 14px", fontSize: "13px",
                          border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none",
                          fontFamily: "inherit",
                        }}
                        placeholder="Write a reply…"
                        value={replyText[ann.id] || ""}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [ann.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && submitReply(ann.id, false)}
                      />
                      {/* Voice button */}
                      <button
                        onClick={() => startVoice(ann.id)}
                        title="Voice reply"
                        style={{
                          padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: "8px",
                          cursor: "pointer", fontSize: "15px",
                          background: isListening === ann.id ? "#fee2e2" : "#f8fafc",
                        }}
                      >
                        🎤
                      </button>
                      <button
                        onClick={() => submitReply(ann.id, false)}
                        style={{
                          padding: "9px 18px", background: "#2563eb", color: "#fff",
                          border: "none", borderRadius: "8px", fontWeight: 600,
                          fontSize: "13px", cursor: "pointer",
                        }}
                      >
                        Reply
                      </button>
                    </div>
                    {isListening === ann.id && (
                      <Typography sx={{ color: "#ef4444", fontSize: "12px", mt: 0.5 }}>
                        🎤 Listening… speak now
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}

        </Box>
      </Box>
    </>
  );
}

export default AdminDashboard;