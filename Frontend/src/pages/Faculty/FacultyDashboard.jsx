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
import GradeIcon from "@mui/icons-material/Grade";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import BarChartIcon from "@mui/icons-material/BarChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SchoolIcon from "@mui/icons-material/School";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell
} from "recharts";

const drawerWidth = 240;
const FONT   = "'Google Sans','Roboto','Segoe UI',sans-serif";
const C_MAIN = "#1a73e8";
const C_BG   = "#f8f9fa";
const C_CARD = "#ffffff";
const C_BORDER = "#e0e0e0";
const C_TEXT = "#000000";
const C_SUB  = "#5f6368";

const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];
const BAND_COLOR = { Excellent:"#34a853", Good:"#1a73e8", "Needs Improvement":"#fbbc04", Weak:"#ea4335" };
const BAND_BG    = { Excellent:"#e6f4ea", Good:"#e8f0fe", "Needs Improvement":"#fef7e0", Weak:"#fce8e6" };

const BASE_URL = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getAuthHeaders() {
  return {
    "Authorization": "Bearer " + getToken()
  };
}

function getJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}

function card(sx) {
  var base = {
    background: C_CARD, borderRadius: 12,
    border: "1px solid " + C_BORDER,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    padding: 20
  };
  if (sx) {
    Object.keys(sx).forEach(function(k) { base[k] = sx[k]; });
  }
  return base;
}

function Badge(props) {
  var label = props.label;
  var color = props.color || C_MAIN;
  var bg = props.bg || "#e8f0fe";
  return (
    React.createElement("span", {
      style: {
        background: bg, color: color,
        borderRadius: 99, padding: "2px 10px",
        fontSize: 11, fontWeight: 600, fontFamily: FONT,
      }
    }, label)
  );
}

function StatCard(props) {
  var icon = props.icon;
  var label = props.label;
  var value = props.value;
  var color = props.color || C_MAIN;
  return (
    React.createElement("div", {
      style: Object.assign({}, card(), { display:"flex", alignItems:"center", gap:16, flex:1, minWidth:150 })
    },
      React.createElement("div", {
        style: { background: color+"18", borderRadius: 10, padding: 10, display:"flex" }
      },
        React.cloneElement(icon, { style: { color: color, fontSize: 26 } })
      ),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize:22, fontWeight:700, color:C_TEXT, lineHeight:1 } }, value),
        React.createElement("div", { style: { fontSize:12, color:C_SUB, marginTop:2 } }, label)
      )
    )
  );
}

function useSortState() {
  var _s = useState(null);
  var col = _s[0]; var setCol = _s[1];
  var _d = useState("asc");
  var dir = _d[0]; var setDir = _d[1];

  function toggle(c) {
    if (col === c) {
      setDir(function(d) { return d === "asc" ? "desc" : "asc"; });
    } else {
      setCol(c);
      setDir("asc");
    }
  }

  function sort(arr) {
    if (!col) return arr;
    return arr.slice().sort(function(a, b) {
      var A = a[col] != null ? a[col] : "";
      var B = b[col] != null ? b[col] : "";
      var cmp = typeof A === "number" ? A - B : String(A).localeCompare(String(B));
      return dir === "asc" ? cmp : -cmp;
    });
  }

  function Th(props) {
    var children = props.children;
    var field = props.field;
    var style = props.style || {};
    return React.createElement("th", {
      onClick: function() { toggle(field); },
      style: Object.assign({
        cursor: "pointer", userSelect: "none",
        fontFamily: FONT, fontWeight: 600, fontSize: 12, color: C_SUB,
        padding: "10px 14px", textAlign: "left", whiteSpace: "nowrap"
      }, style)
    }, children, " ", col === field ? (dir === "asc" ? "↑" : "↓") : "↕");
  }

  return { sort: sort, Th: Th };
}

export default function FacultyDashboard() {
  var navigate = useNavigate();

  var facultyName = (function() {
    try {
      return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).name || "Faculty";
    } catch(e) { return "Faculty"; }
  })();

  var facultyDept = (function() {
    try {
      return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).department || "";
    } catch(e) { return ""; }
  })();

  var _tab = useState("Dashboard");
  var tab = _tab[0]; var setTab = _tab[1];

  var _students = useState([]);
  var students = _students[0]; var setStudents = _students[1];

  var _marks = useState([]);
  var marks = _marks[0]; var setMarks = _marks[1];

  var _attendance = useState([]);
  var attendance = _attendance[0]; var setAttendance = _attendance[1];

  var _announcements = useState([]);
  var announcements = _announcements[0]; var setAnnouncements = _announcements[1];

  var _allEff = useState([]);
  var allEff = _allEff[0]; var setAllEff = _allEff[1];

  var _loading = useState(true);
  var loading = _loading[0]; var setLoading = _loading[1];

  var _selStudent = useState(null);
  var selStudent = _selStudent[0]; var setSelStudent = _selStudent[1];

  var _stuMarks = useState(null);
  var stuMarks = _stuMarks[0]; var setStuMarks = _stuMarks[1];

  var _stuAtt = useState([]);
  var stuAtt = _stuAtt[0]; var setStuAtt = _stuAtt[1];

  var _stuEff = useState(null);
  var stuEff = _stuEff[0]; var setStuEff = _stuEff[1];

  var _stuNotes = useState([]);
  var stuNotes = _stuNotes[0]; var setStuNotes = _stuNotes[1];

  var _noteText = useState("");
  var noteText = _noteText[0]; var setNoteText = _noteText[1];

  var _noteLoading = useState(false);
  var noteLoading = _noteLoading[0]; var setNoteLoading = _noteLoading[1];

  var _searchQ = useState("");
  var searchQ = _searchQ[0]; var setSearchQ = _searchQ[1];

  var _expandedAnn = useState(null);
  var expandedAnn = _expandedAnn[0]; var setExpandedAnn = _expandedAnn[1];

  var _replies = useState({});
  var replies = _replies[0]; var setReplies = _replies[1];

  var _replyText = useState("");
  var replyText = _replyText[0]; var setReplyText = _replyText[1];

  var _cpCur = useState("");
  var cpCur = _cpCur[0]; var setCpCur = _cpCur[1];

  var _cpNew = useState("");
  var cpNew = _cpNew[0]; var setCpNew = _cpNew[1];

  var _cpNew2 = useState("");
  var cpNew2 = _cpNew2[0]; var setCpNew2 = _cpNew2[1];

  var _cpMsg = useState("");
  var cpMsg = _cpMsg[0]; var setCpMsg = _cpMsg[1];

  var _markSemFilter = useState("All");
  var markSemFilter = _markSemFilter[0]; var setMarkSemFilter = _markSemFilter[1];

  function doFetch(path, setter) {
    return fetch(BASE_URL + "/" + path, { headers: getAuthHeaders() })
      .then(function(r) {
        if (r.ok) return r.json();
        return null;
      })
      .then(function(d) {
        if (d) setter(d);
      })
      .catch(function(e) { console.error(path, e); });
  }

  function loadAllEff() {
    fetch(BASE_URL + "/admin/all-efficiency", { headers: getAuthHeaders() })
      .then(function(r) { if (r.ok) return r.json(); return null; })
      .then(function(d) { if (d) setAllEff(d); })
      .catch(function() {});
  }

  function loadReplies(id) {
    fetch(BASE_URL + "/announcement/" + id + "/replies", { headers: getAuthHeaders() })
      .then(function(r) { if (r.ok) return r.json(); return []; })
      .then(function(d) {
        setReplies(function(prev) {
          var next = Object.assign({}, prev);
          next[id] = Array.isArray(d) ? d : [];
          return next;
        });
      })
      .catch(function() {});
  }

  useEffect(function() {
    Promise.all([
      doFetch("students",        setStudents),
      doFetch("all-marks",       setMarks),
      doFetch("attendance-list", setAttendance),
      doFetch("announcements",   setAnnouncements),
    ]).then(function() {
      loadAllEff();
      setLoading(false);
    });
  }, []);

  function openStudent(stu) {
    setSelStudent(stu);
    setNoteText("");
    setStuNotes([]);
    setStuMarks(null);
    setStuAtt([]);
    setStuEff(null);
    setTab("Students");

    fetch(BASE_URL + "/student-marks/" + stu.id, { headers: getAuthHeaders() })
      .then(function(r) { if (r.ok) return r.json(); return null; })
      .then(function(d) { if (d) setStuMarks(d); })
      .catch(function() {});

    fetch(BASE_URL + "/student-attendance/" + stu.id, { headers: getAuthHeaders() })
      .then(function(r) { if (r.ok) return r.json(); return null; })
      .then(function(d) { if (d) setStuAtt(d); })
      .catch(function() {});

    fetch(BASE_URL + "/efficiency/" + stu.id, { headers: getAuthHeaders() })
      .then(function(r) { if (r.ok) return r.json(); return null; })
      .then(function(d) { if (d) setStuEff(d); })
      .catch(function() {});

    fetch(BASE_URL + "/faculty/notes/" + stu.id, { headers: getAuthHeaders() })
      .then(function(r) { if (r.ok) return r.json(); return null; })
      .then(function(d) { if (d) setStuNotes(d); })
      .catch(function() {});
  }

  function addNote() {
    if (!noteText.trim() || !selStudent) return;
    setNoteLoading(true);
    fetch(BASE_URL + "/faculty/note", {
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify({ student_id: selStudent.id, note: noteText.trim() })
    })
      .then(function(r) {
        setNoteText("");
        setStuNotes(function(n) {
          return [{ note: noteText.trim(), created_at: new Date().toISOString() }].concat(n);
        });
        setNoteLoading(false);
      })
      .catch(function() {
        setStuNotes(function(n) {
          return [{ note: noteText.trim(), created_at: new Date().toISOString() }].concat(n);
        });
        setNoteText("");
        setNoteLoading(false);
      });
  }

  function toggleAnn(id) {
    if (expandedAnn === id) {
      setExpandedAnn(null);
    } else {
      setExpandedAnn(id);
      loadReplies(id);
    }
  }

  function submitReply(id) {
    if (!replyText.trim()) return;
    var text = replyText.trim();
    fetch(BASE_URL + "/announcement/" + id + "/reply", {
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify({ reply_text: text })
    })
      .then(function() {
        setReplyText("");
        loadReplies(id);
      })
      .catch(function() {});
  }

  function changePassword() {
    setCpMsg("");
    if (cpNew !== cpNew2) { setCpMsg("Passwords don't match"); return; }
    if (cpNew.length < 4)  { setCpMsg("Min 4 characters"); return; }
    fetch(BASE_URL + "/change-password", {
      method: "PUT",
      headers: getJsonHeaders(),
      body: JSON.stringify({ current_password: cpCur, new_password: cpNew })
    })
      .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, d: d }; }); })
      .then(function(res) {
        setCpMsg(res.d.message);
        if (res.ok) { setCpCur(""); setCpNew(""); setCpNew2(""); }
      })
      .catch(function() { setCpMsg("Server error"); });
  }

  var deptStudents = students.filter(function(s) { return s.department === facultyDept; });

  var filteredStudents = deptStudents.filter(function(s) {
    if (!searchQ) return true;
    return s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
           (s.rollno || "").toLowerCase().includes(searchQ.toLowerCase());
  });

  var deptMarks = marks.filter(function(m) {
    var stu = students.find(function(s) { return s.id === m.student_id; });
    return stu && stu.department === facultyDept;
  });

  var filteredMarks = markSemFilter === "All"
    ? deptMarks
    : deptMarks.filter(function(m) { return m.semester === markSemFilter; });

  var deptAtt = attendance.filter(function(a) {
    var stu = students.find(function(s) { return s.id === a.student_id; });
    return stu && stu.department === facultyDept;
  });

  var avgCgpa = (function() {
    var ef = allEff.filter(function(e) { return e.department === facultyDept; });
    if (!ef.length) return "—";
    return (ef.reduce(function(s, e) { return s + parseFloat(e.cgpa || 0); }, 0) / ef.length).toFixed(2);
  })();

  var lowAttStudents = deptStudents.filter(function(s) {
    var rows = deptAtt.filter(function(a) { return a.student_id === s.id; });
    if (!rows.length) return false;
    var avg = rows.reduce(function(sum, r) { return sum + Number(r.attendance_percentage); }, 0) / rows.length;
    return avg < 75;
  });

  var bandCounts = { Excellent:0, Good:0, "Needs Improvement":0, Weak:0 };
  allEff.filter(function(e) { return e.department === facultyDept; }).forEach(function(e) {
    if (bandCounts[e.band] !== undefined) bandCounts[e.band]++;
  });

  var semAvgData = SEMESTERS.map(function(sem) {
    var semMarks = deptMarks.filter(function(m) { return m.semester === sem; });
    var avg = semMarks.length
      ? semMarks.reduce(function(s, m) { return s + Number(m.marks_scored); }, 0) / semMarks.length
      : 0;
    return { sem: sem.replace("Sem ", "S"), avg: Math.round(avg * 10) / 10 };
  }).filter(function(d) { return d.avg > 0; });

  var stuSort  = useSortState();
  var markSort = useSortState();
  var attSort  = useSortState();
  var effSort  = useSortState();

  var NAV = [
    { label:"Dashboard",     icon: React.createElement(DashboardIcon) },
    { label:"My Students",   icon: React.createElement(PeopleIcon) },
    { label:"Marks",         icon: React.createElement(GradeIcon) },
    { label:"Attendance",    icon: React.createElement(EventAvailableIcon) },
    { label:"Performance",   icon: React.createElement(BarChartIcon) },
    { label:"Announcements", icon: React.createElement(AnnouncementIcon) },
    { label:"Change Password", icon: React.createElement(LockIcon) },
  ];

  if (loading) {
    return (
      <Box sx={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>
        <Typography sx={{ color:C_SUB }}>Loading...</Typography>
      </Box>
    );
  }

  /* ── DASHBOARD ── */
  function renderDashboard() {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
        <div style={Object.assign({}, card(), { background:"linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%)", color:"#fff", padding:"28px" })}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:FONT }}>Welcome, {facultyName} 👋</div>
          <div style={{ fontSize:14, marginTop:4, opacity:0.85 }}>Mentor — {facultyDept} Department</div>
        </div>

        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          <StatCard icon={<PeopleIcon/>}        label="My Students"     value={deptStudents.length}      color="#1a73e8"/>
          <StatCard icon={<SchoolIcon/>}         label="Avg CGPA"        value={avgCgpa}                  color="#34a853"/>
          <StatCard icon={<EventAvailableIcon/>} label="Low Attendance"  value={lowAttStudents.length}    color="#ea4335"/>
          <StatCard icon={<EmojiEventsIcon/>}    label="Announcements"   value={announcements.length}     color="#fbbc04"/>
        </div>

        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          <div style={Object.assign({}, card(), { flex:1, minWidth:220 })}>
            <div style={{ fontWeight:700, fontSize:15, fontFamily:FONT, marginBottom:16 }}>Student Bands</div>
            {Object.entries(bandCounts).map(function(entry) {
              var band = entry[0]; var count = entry[1];
              return (
                <div key={band} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background: BAND_COLOR[band] }}/>
                  <div style={{ flex:1, fontSize:13, fontFamily:FONT }}>{band}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:80 }}>
                    <div style={{ flex:1, background:"#f1f3f4", borderRadius:4, height:6 }}>
                      <div style={{ width: (deptStudents.length ? Math.round((count/deptStudents.length)*100) : 0) + "%", background: BAND_COLOR[band], height:6, borderRadius:4 }}/>
                    </div>
                    <span style={{ fontSize:12, color:C_SUB, minWidth:20 }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {semAvgData.length > 0 && (
            <div style={Object.assign({}, card(), { flex:2, minWidth:260 })}>
              <div style={{ fontWeight:700, fontSize:15, fontFamily:FONT, marginBottom:16 }}>Avg Marks by Semester</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={semAvgData} barSize={28}>
                  <XAxis dataKey="sem" tick={{ fontFamily:FONT, fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{ fontFamily:FONT, fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ fontFamily:FONT, fontSize:12 }}/>
                  <Bar dataKey="avg" radius={[4,4,0,0]}>
                    {semAvgData.map(function(_, i) { return <Cell key={i} fill={C_MAIN}/>; })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {lowAttStudents.length > 0 && (
          <div style={Object.assign({}, card(), { borderLeft:"4px solid #ea4335", background:"#fff8f7" })}>
            <div style={{ fontWeight:700, fontSize:14, fontFamily:FONT, color:"#ea4335", marginBottom:10 }}>
              ⚠ Students Below 75% Attendance ({lowAttStudents.length})
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {lowAttStudents.map(function(s) {
                return (
                  <span key={s.id} onClick={function() { openStudent(s); }} style={{
                    background:"#fce8e6", color:"#c62828", borderRadius:99,
                    padding:"4px 12px", fontSize:12, cursor:"pointer", fontFamily:FONT
                  }}>{s.name} ({s.rollno})</span>
                );
              })}
            </div>
          </div>
        )}

        {announcements.length > 0 && (
          <div style={card()}>
            <div style={{ fontWeight:700, fontSize:15, fontFamily:FONT, marginBottom:12 }}>Recent Announcements</div>
            {announcements.slice(0,3).map(function(a) {
              return (
                <div key={a.id} style={{ padding:"10px 0", borderBottom:"1px solid " + C_BORDER }}>
                  <div style={{ fontWeight:600, fontSize:13, fontFamily:FONT }}>{a.title}</div>
                  <div style={{ color:C_SUB, fontSize:12, marginTop:2 }}>
                    {a.message ? a.message.slice(0,100) : ""}
                    {a.message && a.message.length > 100 ? "…" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── STUDENTS ── */
  function renderStudents() {
    var sorted = stuSort.sort(filteredStudents);
    return (
      <div style={{ display:"flex", gap:20 }}>
        <div style={{ flex: selStudent ? "0 0 320px" : 1 }}>
          <div style={card()}>
            <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT, marginBottom:14 }}>
              My Students — {facultyDept} <span style={{ color:C_SUB, fontWeight:400, fontSize:13 }}>({deptStudents.length})</span>
            </div>
            <input
              placeholder="Search name or roll no…"
              value={searchQ}
              onChange={function(e) { setSearchQ(e.target.value); }}
              style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:"1px solid " + C_BORDER,
                fontFamily:FONT, fontSize:13, marginBottom:12, boxSizing:"border-box" }}
            />
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f8f9fa" }}>
                    <stuSort.Th field="name">Name</stuSort.Th>
                    <stuSort.Th field="rollno">Roll No</stuSort.Th>
                    <stuSort.Th field="email">Email</stuSort.Th>
                    <th style={{ padding:"10px 14px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(function(s) {
                    return (
                      <tr key={s.id} onClick={function() { openStudent(s); }}
                        style={{ cursor:"pointer", background: selStudent && selStudent.id===s.id ? "#e8f0fe" : "transparent" }}>
                        <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>
                          <div style={{ fontWeight:600 }}>{s.name}</div>
                        </td>
                        <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12, color:C_SUB }}>{s.rollno}</td>
                        <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12, color:C_SUB }}>{s.email}</td>
                        <td style={{ padding:"10px 14px" }}>
                          <PersonSearchIcon style={{ color:C_MAIN, fontSize:18 }}/>
                        </td>
                      </tr>
                    );
                  })}
                  {!sorted.length && (
                    <tr><td colSpan={4} style={{ padding:24, textAlign:"center", color:C_SUB, fontFamily:FONT, fontSize:13 }}>No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selStudent && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>
            <div style={Object.assign({}, card(), { display:"flex", justifyContent:"space-between", alignItems:"center" })}>
              <div>
                <div style={{ fontWeight:700, fontSize:17, fontFamily:FONT }}>{selStudent.name}</div>
                <div style={{ color:C_SUB, fontSize:13 }}>{selStudent.rollno} · {selStudent.email}</div>
              </div>
              <button onClick={function() { setSelStudent(null); }} style={{
                border:"none", background:"#f1f3f4", borderRadius:8, padding:"6px 14px",
                cursor:"pointer", fontFamily:FONT, fontSize:13 }}>✕ Close</button>
            </div>

            {stuEff && (
              <div style={Object.assign({}, card(), { display:"flex", gap:20, flexWrap:"wrap" })}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontWeight:700, fontSize:14, fontFamily:FONT, marginBottom:12 }}>Efficiency</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={[
                      { subject:"Skills",       A: stuEff.skillScore       },
                      { subject:"Achievements", A: stuEff.achievementScore },
                      { subject:"Activities",   A: stuEff.activityScore    },
                      { subject:"CGPA",         A: stuEff.cgpaScore        },
                    ]}>
                      <PolarGrid stroke="#e0e0e0"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontFamily:FONT, fontSize:11 }}/>
                      <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }}/>
                      <Radar dataKey="A" stroke={C_MAIN} fill={C_MAIN} fillOpacity={0.2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:10, minWidth:160 }}>
                  <div style={{ padding:"10px 16px", borderRadius:10, background: BAND_BG[stuEff.band], textAlign:"center" }}>
                    <div style={{ fontSize:11, color:C_SUB, fontFamily:FONT }}>Score</div>
                    <div style={{ fontSize:26, fontWeight:700, color: BAND_COLOR[stuEff.band] }}>{stuEff.finalScore}</div>
                    <Badge label={stuEff.band} color={BAND_COLOR[stuEff.band]} bg={BAND_BG[stuEff.band]}/>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={Object.assign({}, card({ padding:"8px 12px" }), { flex:1, textAlign:"center" })}>
                      <div style={{ fontSize:10, color:C_SUB }}>Dept Rank</div>
                      <div style={{ fontWeight:700 }}>#{stuEff.deptRank}/{stuEff.deptTotal}</div>
                    </div>
                    <div style={Object.assign({}, card({ padding:"8px 12px" }), { flex:1, textAlign:"center" })}>
                      <div style={{ fontSize:10, color:C_SUB }}>Overall</div>
                      <div style={{ fontWeight:700 }}>#{stuEff.overallRank}/{stuEff.overallTotal}</div>
                    </div>
                  </div>
                  <div style={Object.assign({}, card({ padding:"8px 12px" }), { textAlign:"center" })}>
                    <div style={{ fontSize:10, color:C_SUB }}>CGPA</div>
                    <div style={{ fontWeight:700, fontSize:20, color:C_MAIN }}>{stuEff.cgpa}</div>
                  </div>
                </div>
              </div>
            )}

            {stuMarks && stuMarks.semesters && stuMarks.semesters.length > 0 && (
              <div style={card()}>
                <div style={{ fontWeight:700, fontSize:14, fontFamily:FONT, marginBottom:12 }}>Marks by Semester</div>
                {stuMarks.semesters.map(function(sem) {
                  return (
                    <div key={sem.semester} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontWeight:600, fontSize:13, fontFamily:FONT }}>{sem.semester}</span>
                        <span style={{ fontSize:12, color:C_MAIN }}>SGPA: <b>{sem.sgpa}</b></span>
                      </div>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead>
                          <tr style={{ background:"#f8f9fa" }}>
                            {["Subject","Marks","Grade"].map(function(h) {
                              return <th key={h} style={{ padding:"6px 10px", fontFamily:FONT, textAlign:"left", color:C_SUB, fontWeight:600 }}>{h}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {sem.subjects.map(function(sub) {
                            return (
                              <tr key={sub.id} style={{ borderBottom:"1px solid " + C_BORDER }}>
                                <td style={{ padding:"6px 10px", fontFamily:FONT }}>{sub.subject_name}</td>
                                <td style={{ padding:"6px 10px", fontFamily:FONT }}>{sub.marks_scored}</td>
                                <td style={{ padding:"6px 10px" }}>
                                  <Badge label={sub.grade}
                                    color={sub.grade === "F" ? "#ea4335" : "#34a853"}
                                    bg={sub.grade === "F" ? "#fce8e6" : "#e6f4ea"}/>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
                <div style={{ marginTop:8, textAlign:"right", fontSize:13, fontFamily:FONT }}>
                  Overall CGPA: <b style={{ color:C_MAIN }}>{stuMarks.cgpa}</b>
                </div>
              </div>
            )}

            {stuAtt.length > 0 && (
              <div style={card()}>
                <div style={{ fontWeight:700, fontSize:14, fontFamily:FONT, marginBottom:12 }}>Attendance</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"#f8f9fa" }}>
                      {["Semester","Present","Total","Percentage"].map(function(h) {
                        return <th key={h} style={{ padding:"6px 10px", fontFamily:FONT, textAlign:"left", color:C_SUB, fontWeight:600 }}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {stuAtt.map(function(a) {
                      return (
                        <tr key={a.id} style={{ borderBottom:"1px solid " + C_BORDER }}>
                          <td style={{ padding:"6px 10px", fontFamily:FONT }}>{a.semester}</td>
                          <td style={{ padding:"6px 10px", fontFamily:FONT }}>{a.present_days}</td>
                          <td style={{ padding:"6px 10px", fontFamily:FONT }}>{a.total_days}</td>
                          <td style={{ padding:"6px 10px" }}>
                            <Badge
                              label={a.attendance_percentage + "%"}
                              color={a.attendance_percentage >= 75 ? "#34a853" : "#ea4335"}
                              bg={a.attendance_percentage >= 75 ? "#e6f4ea" : "#fce8e6"}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={card()}>
              <div style={{ fontWeight:700, fontSize:14, fontFamily:FONT, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                <NoteAddIcon style={{ color:C_MAIN, fontSize:18 }}/> Mentor Notes
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <textarea
                  value={noteText}
                  onChange={function(e) { setNoteText(e.target.value); }}
                  placeholder="Add a private note about this student…"
                  rows={3}
                  style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid " + C_BORDER,
                    fontFamily:FONT, fontSize:13, resize:"vertical" }}
                />
                <button onClick={addNote} disabled={noteLoading || !noteText.trim()}
                  style={{ padding:"10px 18px", background:C_MAIN, color:"#fff", border:"none",
                    borderRadius:8, cursor:"pointer", fontFamily:FONT, fontSize:13,
                    opacity: (!noteText.trim() || noteLoading) ? 0.5 : 1 }}>
                  {noteLoading ? "Saving…" : "Add Note"}
                </button>
              </div>
              {stuNotes.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {stuNotes.map(function(n, i) {
                    return (
                      <div key={i} style={{ background:"#f8f9fa", borderRadius:8, padding:"10px 14px" }}>
                        <div style={{ fontSize:13, fontFamily:FONT }}>{n.note}</div>
                        {n.created_at && (
                          <div style={{ fontSize:11, color:C_SUB, marginTop:4 }}>
                            {new Date(n.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color:C_SUB, fontSize:13, fontFamily:FONT }}>No notes yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── MARKS ── */
  function renderMarks() {
    var sems = ["All"].concat(SEMESTERS.filter(function(s) {
      return deptMarks.some(function(m) { return m.semester === s; });
    }));
    var sorted = markSort.sort(filteredMarks);
    return (
      <div style={card()}>
        <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT, marginBottom:14 }}>Marks — {facultyDept}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          {sems.map(function(s) {
            return (
              <button key={s} onClick={function() { setMarkSemFilter(s); }}
                style={{ padding:"4px 14px", borderRadius:99, border:"none",
                  background: markSemFilter === s ? C_MAIN : "#f1f3f4",
                  color: markSemFilter === s ? "#fff" : C_TEXT,
                  cursor:"pointer", fontFamily:FONT, fontSize:12 }}>
                {s}
              </button>
            );
          })}
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8f9fa" }}>
                <markSort.Th field="student_name">Student</markSort.Th>
                <markSort.Th field="rollno">Roll No</markSort.Th>
                <markSort.Th field="semester">Semester</markSort.Th>
                <markSort.Th field="subject_name">Subject</markSort.Th>
                <markSort.Th field="marks_scored">Marks</markSort.Th>
                <markSort.Th field="grade">Grade</markSort.Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(function(m, i) {
                return (
                  <tr key={i} style={{ borderBottom:"1px solid " + C_BORDER }}>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>{m.student_name}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12, color:C_SUB }}>
                      {(students.find(function(s) { return s.id === m.student_id; }) || {}).rollno || "—"}
                    </td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12 }}>{m.semester}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12 }}>{m.subject_name}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13, fontWeight:600 }}>{m.marks_scored}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <Badge label={m.grade}
                        color={m.grade === "F" ? "#ea4335" : "#34a853"}
                        bg={m.grade === "F" ? "#fce8e6" : "#e6f4ea"}/>
                    </td>
                  </tr>
                );
              })}
              {!sorted.length && (
                <tr><td colSpan={6} style={{ padding:24, textAlign:"center", color:C_SUB, fontFamily:FONT }}>No marks data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── ATTENDANCE ── */
  function renderAttendance() {
    var sorted = attSort.sort(deptAtt);
    return (
      <div style={card()}>
        <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT, marginBottom:14 }}>Attendance — {facultyDept}</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8f9fa" }}>
                <attSort.Th field="student_name">Student</attSort.Th>
                <attSort.Th field="rollno">Roll No</attSort.Th>
                <attSort.Th field="semester">Semester</attSort.Th>
                <attSort.Th field="present_days">Present Days</attSort.Th>
                <attSort.Th field="total_days">Total Days</attSort.Th>
                <attSort.Th field="attendance_percentage">Percentage</attSort.Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(function(a, i) {
                return (
                  <tr key={i} style={{ borderBottom:"1px solid " + C_BORDER }}>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>{a.student_name}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12, color:C_SUB }}>{a.rollno}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12 }}>{a.semester}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>{a.present_days}</td>
                    <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>{a.total_days}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:60, background:"#f1f3f4", borderRadius:4, height:6 }}>
                          <div style={{ width: Math.min(a.attendance_percentage, 100) + "%",
                            background: a.attendance_percentage >= 75 ? "#34a853" : "#ea4335",
                            height:6, borderRadius:4 }}/>
                        </div>
                        <Badge
                          label={a.attendance_percentage + "%"}
                          color={a.attendance_percentage >= 75 ? "#34a853" : "#ea4335"}
                          bg={a.attendance_percentage >= 75 ? "#e6f4ea" : "#fce8e6"}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!sorted.length && (
                <tr><td colSpan={6} style={{ padding:24, textAlign:"center", color:C_SUB, fontFamily:FONT }}>No attendance data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── PERFORMANCE ── */
  function renderPerformance() {
    var deptEff = allEff.filter(function(e) { return e.department === facultyDept; });
    var sorted  = effSort.sort(deptEff);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div style={card()}>
          <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT, marginBottom:14 }}>Efficiency Scores — {facultyDept}</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#f8f9fa" }}>
                  <effSort.Th field="name">Student</effSort.Th>
                  <effSort.Th field="rollno">Roll No</effSort.Th>
                  <effSort.Th field="cgpa">CGPA</effSort.Th>
                  <effSort.Th field="finalScore">Score/100</effSort.Th>
                  <effSort.Th field="deptRank">Dept Rank</effSort.Th>
                  <effSort.Th field="overallRank">Overall Rank</effSort.Th>
                  <th style={{ padding:"10px 14px", fontFamily:FONT, fontWeight:600, fontSize:12, color:C_SUB }}>Band</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(function(e) {
                  return (
                    <tr key={e.id} style={{ borderBottom:"1px solid " + C_BORDER, cursor:"pointer" }}
                      onClick={function() {
                        var stu = deptStudents.find(function(s) { return s.id === e.id; });
                        if (stu) openStudent(stu);
                      }}>
                      <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13, fontWeight:600 }}>{e.name}</td>
                      <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:12, color:C_SUB }}>{e.rollno}</td>
                      <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>{e.cgpa}</td>
                      <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13, fontWeight:700, color:C_MAIN }}>{e.finalScore}</td>
                      <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>#{e.deptRank}/{e.deptTotal}</td>
                      <td style={{ padding:"10px 14px", fontFamily:FONT, fontSize:13 }}>#{e.overallRank}/{e.overallTotal}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <Badge label={e.band} color={BAND_COLOR[e.band]} bg={BAND_BG[e.band]}/>
                      </td>
                    </tr>
                  );
                })}
                {!sorted.length && (
                  <tr><td colSpan={7} style={{ padding:24, textAlign:"center", color:C_SUB, fontFamily:FONT }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {deptEff.length > 0 && (
          <div style={card()}>
            <div style={{ fontWeight:700, fontSize:15, fontFamily:FONT, marginBottom:14 }}>Score Comparison</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptEff.slice(0,15).map(function(e) { return { name: e.name.split(" ")[0], score: e.finalScore }; })} barSize={22}>
                <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontFamily:FONT, fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontFamily:FONT, fontSize:12 }}/>
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {deptEff.slice(0,15).map(function(e, i) {
                    return <Cell key={i} fill={BAND_COLOR[e.band]}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }

  /* ── ANNOUNCEMENTS ── */
  function renderAnnouncements() {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT, marginBottom:4 }}>Announcements</div>
        {!announcements.length && (
          <div style={Object.assign({}, card(), { color:C_SUB, fontFamily:FONT, textAlign:"center", padding:32 })}>No announcements</div>
        )}
        {announcements.map(function(a) {
          return (
            <div key={a.id} style={card()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, fontFamily:FONT }}>{a.title}</div>
                  <div style={{ color:C_SUB, fontSize:12, marginTop:2 }}>{a.message}</div>
                  <div style={{ color:C_SUB, fontSize:11, marginTop:6 }}>
                    {new Date(a.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                    {" · "}
                    <Badge label={a.target === "all" ? "All Departments" : a.target} color={C_MAIN} bg="#e8f0fe"/>
                  </div>
                </div>
                <button onClick={function() { toggleAnn(a.id); }}
                  style={{ border:"none", background:"none", cursor:"pointer", color:C_MAIN }}>
                  {expandedAnn === a.id ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                </button>
              </div>
              {expandedAnn === a.id && (
                <div style={{ marginTop:14, borderTop:"1px solid " + C_BORDER, paddingTop:14 }}>
                  <div style={{ fontWeight:600, fontSize:13, fontFamily:FONT, marginBottom:8 }}>Replies</div>
                  {(replies[a.id] || []).map(function(r, i) {
                    return (
                      <div key={i} style={{ background:"#f8f9fa", borderRadius:8, padding:"8px 12px", marginBottom:6 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C_MAIN, fontFamily:FONT }}>{r.user_name}</div>
                        <div style={{ fontSize:13, fontFamily:FONT, marginTop:2 }}>{r.reply_text}</div>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    <input
                      value={replyText}
                      onChange={function(e) { setReplyText(e.target.value); }}
                      placeholder="Write a reply…"
                      style={{ flex:1, padding:"8px 12px", borderRadius:8, border:"1px solid " + C_BORDER, fontFamily:FONT, fontSize:13 }}
                    />
                    <button onClick={function() { submitReply(a.id); }}
                      style={{ padding:"8px 18px", background:C_MAIN, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:FONT }}>
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ── CHANGE PASSWORD ── */
  function renderChangePassword() {
    return (
      <div style={{ maxWidth:420 }}>
        <div style={card()}>
          <div style={{ fontWeight:700, fontSize:16, fontFamily:FONT, marginBottom:20 }}>Change Password</div>
          {[
            { label:"Current Password", val:cpCur,  set:setCpCur,  ph:"Enter current password" },
            { label:"New Password",     val:cpNew,  set:setCpNew,  ph:"Min 4 characters" },
            { label:"Confirm Password", val:cpNew2, set:setCpNew2, ph:"Repeat new password" },
          ].map(function(f) {
            return (
              <div key={f.label} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:C_SUB, fontFamily:FONT }}>{f.label}</label>
                <input type="password" value={f.val}
                  onChange={function(e) { f.set(e.target.value); }}
                  placeholder={f.ph}
                  style={{ display:"block", width:"100%", marginTop:4, padding:"9px 12px", borderRadius:8,
                    border:"1px solid " + C_BORDER, fontFamily:FONT, fontSize:13, boxSizing:"border-box" }}/>
              </div>
            );
          })}
          {cpMsg && (
            <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12,
              background: (cpMsg.includes("success") || cpMsg.includes("changed")) ? "#e6f4ea" : "#fce8e6",
              color:      (cpMsg.includes("success") || cpMsg.includes("changed")) ? "#34a853" : "#ea4335",
              fontSize:13, fontFamily:FONT }}>
              {cpMsg}
            </div>
          )}
          <button onClick={changePassword}
            style={{ width:"100%", padding:"10px", background:C_MAIN, color:"#fff",
              border:"none", borderRadius:8, cursor:"pointer", fontFamily:FONT, fontSize:14, fontWeight:600 }}>
            Update Password
          </button>
        </div>
      </div>
    );
  }

  var SECTIONS = {
    "Dashboard":       renderDashboard,
    "My Students":     renderStudents,
    "Marks":           renderMarks,
    "Attendance":      renderAttendance,
    "Performance":     renderPerformance,
    "Announcements":   renderAnnouncements,
    "Change Password": renderChangePassword,
  };

  return (
    <Box sx={{ display:"flex", fontFamily:FONT }}>
      <CssBaseline/>

      <AppBar position="fixed" elevation={0}
        sx={{ zIndex: function(t) { return t.zIndex.drawer + 1; }, background:"#fff", borderBottom:"1px solid " + C_BORDER }}>
        <Toolbar sx={{ minHeight:"56px !important" }}>
          <Typography variant="h6" noWrap sx={{ fontFamily:FONT, fontWeight:700, color:C_MAIN, fontSize:17 }}>
            SLEA — Faculty Portal
          </Typography>
          <Box sx={{ flexGrow:1 }}/>
          <Typography sx={{ fontFamily:FONT, fontSize:13, color:C_SUB, mr:1 }}>
            {facultyName} · {facultyDept}
          </Typography>
          <IconButton onClick={function() { localStorage.clear(); navigate("/"); }} size="small">
            <LogoutIcon sx={{ color:C_SUB }}/>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent"
        sx={{ width:drawerWidth, flexShrink:0,
          "& .MuiDrawer-paper":{ width:drawerWidth, boxSizing:"border-box",
            background:"#fff", borderRight:"1px solid " + C_BORDER } }}>
        <Toolbar sx={{ minHeight:"56px !important" }}/>
        <Divider/>
        <Box sx={{ mt:1 }}>
          <Box sx={{ px:2, py:1.5 }}>
            <Typography sx={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:C_SUB, letterSpacing:1 }}>
              MENTOR PANEL
            </Typography>
          </Box>
          <List dense>
            {NAV.map(function(item) {
              return (
                <ListItem key={item.label} disablePadding>
                  <ListItemButton
                    onClick={function() {
                      setTab(item.label);
                      if (item.label !== "My Students") setSelStudent(null);
                    }}
                    sx={{
                      borderRadius:"0 24px 24px 0", mx:1, px:2,
                      background: tab === item.label ? "#e8f0fe" : "transparent",
                      "&:hover":{ background:"#f1f3f4" },
                    }}>
                    <ListItemIcon sx={{ minWidth:36, color: tab === item.label ? C_MAIN : C_SUB }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label}
                      primaryTypographyProps={{ fontFamily:FONT, fontSize:13,
                        fontWeight: tab === item.label ? 700 : 400,
                        color: tab === item.label ? C_MAIN : C_TEXT }}/>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow:1, p:3, mt:"56px", background:C_BG, minHeight:"calc(100vh - 56px)" }}>
        <Typography variant="h6" sx={{ fontFamily:FONT, fontWeight:700, mb:2.5, color:C_TEXT, fontSize:18 }}>
          {tab}
        </Typography>
        {(SECTIONS[tab] || function() { return null; })()}
      </Box>
    </Box>
  );
}