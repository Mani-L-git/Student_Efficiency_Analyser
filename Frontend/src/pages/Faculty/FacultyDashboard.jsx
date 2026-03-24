import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
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
import MuiTooltip from "@mui/material/Tooltip";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import GradeIcon from "@mui/icons-material/Grade";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import BarChartIcon from "@mui/icons-material/BarChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TableChartIcon from "@mui/icons-material/TableChart";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from "recharts";

const drawerWidth = 240;
const FONT = "'Inter','Segoe UI',sans-serif";
const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];
const GRADE_OPTIONS = ["All","O","A+","A","B+","B","C","F"];
const PAGE_SIZES = [5, 25, 100, 1000];

const getAuth  = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const BASE_URL = "http://localhost:5000";

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: { width: `calc(${theme.spacing(8)} + 1px)` },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex", alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(0, 1, 0, 2),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, { shouldForwardProp: p => p !== "open" })(
  ({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    background: "linear-gradient(90deg,#1e3c72,#2a5298)",
    transition: theme.transitions.create(["width","margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(["width","margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  })
);

const Drawer = styled(MuiDrawer, { shouldForwardProp: p => p !== "open" })(
  ({ theme, open }) => ({
    width: drawerWidth, flexShrink: 0,
    whiteSpace: "nowrap", boxSizing: "border-box",
    "& .MuiDrawer-paper": {
      background: "linear-gradient(180deg,#1e3c72,#2a5298)", color: "#fff",
      ...(open ? openedMixin(theme) : closedMixin(theme)),
    },
    ...(open ? openedMixin(theme) : closedMixin(theme)),
  })
);

const S = {
  inp: { width:"100%", padding:"11px 14px", fontSize:"14px", borderRadius:"8px",
         border:"1px solid #cbd5e1", outline:"none", marginBottom:"14px",
         boxSizing:"border-box", fontFamily:FONT, background:"#fff", color:"#0f172a" },
  btn: { width:"100%", padding:"12px", background:"linear-gradient(90deg,#1e3c72,#2a5298)",
         color:"#fff", border:"none", borderRadius:"8px", fontSize:"14px", fontWeight:600,
         cursor:"pointer", fontFamily:FONT, letterSpacing:"0.3px" },
  card: { background:"#fff", borderRadius:"12px", padding:"24px",
          boxShadow:"0 4px 14px rgba(0,0,0,0.07)", fontFamily:FONT },
  th: { padding:"12px 16px", textAlign:"left", fontSize:"11px", fontFamily:FONT,
        letterSpacing:"0.6px", textTransform:"uppercase", fontWeight:700, color:"#fff" },
  td: { padding:"12px 16px", fontFamily:FONT, fontSize:"13px", color:"#000" },
  pageSelect: {
    padding:"6px 10px", borderRadius:"7px", fontSize:"13px", fontFamily:FONT,
    border:"1.5px solid #e2e8f0", background:"#fff", color:"#475569",
    cursor:"pointer", outline:"none",
  },
};

/* ── Pagination bar ── */
function PaginationBar({ page, pages, pageSize, changeSize, setPage, total }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"10px 16px", borderTop:"1px solid #f1f5f9", flexWrap:"wrap", gap:"10px",
      background:"#fafafa", borderRadius:"0 0 12px 12px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
        <span style={{ fontSize:"13px", color:"#64748b", fontFamily:FONT }}>Rows per page:</span>
        <select value={pageSize} onChange={e => changeSize(Number(e.target.value))} style={S.pageSelect}>
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:"12px", color:"#94a3b8", fontFamily:FONT }}>{total} total</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        {[
          { lbl:"«", fn:() => setPage(1),          dis: page===1 },
          { lbl:"‹", fn:() => setPage(p => p-1),   dis: page===1 },
          { lbl:null },
          { lbl:"›", fn:() => setPage(p => p+1),   dis: page===pages },
          { lbl:"»", fn:() => setPage(pages),       dis: page===pages },
        ].map((b,i) => b.lbl === null
          ? <span key={i} style={{ fontSize:"13px", color:"#475569", padding:"0 8px", fontFamily:FONT }}>Page {page} / {pages}</span>
          : <button key={i} onClick={b.fn} disabled={b.dis}
              style={{ padding:"5px 10px", borderRadius:"7px", fontSize:"12px",
                border:"1.5px solid #e2e8f0", background:"#fff",
                cursor: b.dis ? "not-allowed" : "pointer", opacity: b.dis ? 0.4 : 1 }}>
              {b.lbl}
            </button>
        )}
      </div>
    </div>
  );
}

/* ── Sort ── */
const useSortState = () => {
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState("asc");
  const toggle = col => {
    if (sortCol===col) setSortDir(d => d==="asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const sort = (arr, keyFn) => {
    if (!sortCol) return arr;
    return [...arr].sort((a,b) => {
      const va = keyFn(a,sortCol), vb = keyFn(b,sortCol);
      const n = typeof va==="number" && typeof vb==="number"
        ? va - vb
        : String(va ?? "").localeCompare(String(vb ?? ""));
      return sortDir==="asc" ? n : -n;
    });
  };
  return { sortCol, sortDir, toggle, sort };
};

const SortTh = ({ label, col, sortCol, sortDir, onToggle, style={} }) => (
  <th onClick={() => onToggle(col)} style={{
    ...S.th, cursor:"pointer", userSelect:"none",
    whiteSpace:"nowrap", position:"relative", paddingRight:"28px", ...style,
  }}>
    {label}
    <span style={{
      position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)",
      fontSize:"13px", opacity: sortCol===col ? 1 : 0.3,
      color: sortCol===col ? "#93c5fd" : "#fff",
    }}>
      {sortCol===col ? (sortDir==="asc" ? "↑" : "↓") : "↕"}
    </span>
  </th>
);

const bandColor = b =>
  b==="Excellent" ? "#16a34a" : b==="Good" ? "#2563eb" : b==="Needs Improvement" ? "#d97706" : "#dc2626";
const bandBg = b =>
  b==="Excellent" ? "#dcfce7" : b==="Good" ? "#dbeafe" : b==="Needs Improvement" ? "#fef9c3" : "#fee2e2";

const Chip = ({ label, color="#2563eb", bg="#dbeafe" }) => (
  <span style={{
    background:bg, color, borderRadius:"999px", padding:"2px 10px",
    fontSize:"11px", fontWeight:600, fontFamily:FONT, whiteSpace:"nowrap",
  }}>{label}</span>
);

const KpiCard = ({ label, value, color="#2563eb", sub="" }) => (
  <Box sx={{ ...S.card, flex:"1 1 160px", borderTop:`4px solid ${color}`, textAlign:"center" }}>
    <Typography sx={{ fontSize:"13px", color:"#64748b", mb:0.5, fontFamily:FONT }}>{label}</Typography>
    <Typography sx={{ fontSize:"30px", fontWeight:700, color, fontFamily:FONT }}>{value}</Typography>
    {sub && <Typography sx={{ fontSize:"11px", color:"#94a3b8", fontFamily:FONT }}>{sub}</Typography>}
  </Box>
);

/* ════════════════════════════════════════════════════════ MAIN */
export default function FacultyDashboard() {
  const navigate  = useNavigate();
  const theme     = useTheme();

  const token = localStorage.getItem("token") || "";
  const jwt   = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();
  const facultyName = jwt.name       || "Faculty";
  const facultyDept = jwt.department || "";

  const [tab,        setTab]        = useState("Dashboard");
  const [loading,    setLoading]    = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [students,      setStudents]      = useState([]);
  const [marks,         setMarks]         = useState([]);
  const [attendance,    setAttendance]    = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [allEff,        setAllEff]        = useState([]);

  const [selStudent, setSelStudent] = useState(null);
  const [stuMarks,   setStuMarks]   = useState(null);
  const [stuAtt,     setStuAtt]     = useState([]);
  const [stuEff,     setStuEff]     = useState(null);
  const [stuNotes,   setStuNotes]   = useState([]);
  const [noteText,   setNoteText]   = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [searchQ,        setSearchQ]        = useState("");
  const [dirSearchQ,     setDirSearchQ]     = useState("");
  const [markSemFilter,  setMarkSemFilter]  = useState("All");
  const [markGradeFilter,setMarkGradeFilter]= useState("All");
  const [attSemFilter,   setAttSemFilter]   = useState("All");
  const [expandedAnn,    setExpandedAnn]    = useState(null);
  const [replies,        setReplies]        = useState({});
  const [replyText,      setReplyText]      = useState("");

  const [cpCur,  setCpCur]  = useState("");
  const [cpNew,  setCpNew]  = useState("");
  const [cpNew2, setCpNew2] = useState("");
  const [cpMsg,  setCpMsg]  = useState("");

  const [expandedEff, setExpandedEff] = useState(null);

  /* pagination state per table */
  const [stuPage,    setStuPage]    = useState(1); const [stuSize,    setStuSize]    = useState(25);
  const [dirPage,    setDirPage]    = useState(1); const [dirSize,    setDirSize]    = useState(25);
  const [markPage,   setMarkPage]   = useState(1); const [markSize,   setMarkSize]   = useState(25);
  const [attPage,    setAttPage]    = useState(1); const [attSize,    setAttSize]    = useState(25);
  const [effPage,    setEffPage]    = useState(1); const [effSize,    setEffSize]    = useState(25);

  const stuSort  = useSortState();
  const dirSort  = useSortState();
  const markSort = useSortState();
  const attSort  = useSortState();
  const effSort  = useSortState();

  const doFetch = async (path, setter) => {
    try {
      const r = await fetch(`${BASE_URL}/${path}`, { headers: getAuth() });
      if (r.ok) setter(await r.json());
    } catch (e) { console.error(path, e); }
  };

  useEffect(() => {
    Promise.all([
      doFetch("students",        setStudents),
      doFetch("all-marks",       setMarks),
      doFetch("attendance-list", setAttendance),
      doFetch("announcements",   setAnnouncements),
    ])
      .then(async () => {
        try {
          const r = await fetch(`${BASE_URL}/admin/all-efficiency`, { headers: getAuth() });
          if (r.ok) setAllEff(await r.json());
        } catch {}
      })
      .catch(e => console.error("Load error:", e))
      .finally(() => setLoading(false));
  }, []);

  const openStudent = async (stu) => {
    setSelStudent(stu);
    setNoteText(""); setStuNotes([]); setStuMarks(null); setStuAtt([]); setStuEff(null);
    const [mR, aR, eR] = await Promise.all([
      fetch(`${BASE_URL}/student-marks/${stu.id}`,      { headers: getAuth() }),
      fetch(`${BASE_URL}/student-attendance/${stu.id}`, { headers: getAuth() }),
      fetch(`${BASE_URL}/efficiency/${stu.id}`,         { headers: getAuth() }),
    ]);
    if (mR.ok) setStuMarks(await mR.json());
    if (aR.ok) setStuAtt(await aR.json());
    if (eR.ok) setStuEff(await eR.json());
    try {
      const nR = await fetch(`${BASE_URL}/faculty/notes/${stu.id}`, { headers: getAuth() });
      if (nR.ok) setStuNotes(await nR.json());
    } catch {}
  };

  const addNote = async () => {
    if (!noteText.trim() || !selStudent) return;
    setNoteSaving(true);
    try {
      const r = await fetch(`${BASE_URL}/faculty/note`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...getAuth() },
        body: JSON.stringify({ student_id: selStudent.id, note: noteText.trim() }),
      });
      if (r.ok) {
        const nR = await fetch(`${BASE_URL}/faculty/notes/${selStudent.id}`, { headers: getAuth() });
        if (nR.ok) setStuNotes(await nR.json());
      } else {
        setStuNotes(n => [{ note: noteText.trim(), created_at: new Date().toISOString() }, ...n]);
      }
      setNoteText("");
    } catch {
      setStuNotes(n => [{ note: noteText.trim(), created_at: new Date().toISOString() }, ...n]);
      setNoteText("");
    }
    setNoteSaving(false);
  };

  /* ── FIX: loadReplies — await r.json() outside the setter callback ── */
  const loadReplies = async (id) => {
    try {
      const r = await fetch(`${BASE_URL}/announcement/${id}/replies`, { headers: getAuth() });
      if (r.ok) {
        const data = await r.json();
        setReplies(p => ({ ...p, [id]: data }));
      }
    } catch (e) { console.error("loadReplies:", e); }
  };

  const toggleAnn = (id) => {
    if (expandedAnn === id) setExpandedAnn(null);
    else { setExpandedAnn(id); loadReplies(id); }
  };

  const submitReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await fetch(`${BASE_URL}/announcement/${id}/reply`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...getAuth() },
        body: JSON.stringify({ reply_text: replyText.trim() }),
      });
      setReplyText("");
      loadReplies(id);
    } catch (e) { console.error("submitReply:", e); }
  };

  const changePassword = async () => {
    setCpMsg("");
    if (cpNew !== cpNew2) { setCpMsg("Passwords don't match."); return; }
    if (cpNew.length < 4) { setCpMsg("Minimum 4 characters."); return; }
    const r = await fetch(`${BASE_URL}/change-password`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json", ...getAuth() },
      body: JSON.stringify({ current_password: cpCur, new_password: cpNew }),
    });
    const d = await r.json();
    setCpMsg(d.message || (r.ok ? "Password changed successfully." : "Error."));
    if (r.ok) { setCpCur(""); setCpNew(""); setCpNew2(""); }
  };

  const logout = () => { localStorage.clear(); navigate("/"); };

  /* ── Derived ── */
  const deptStudents   = students.filter(s => s.department === facultyDept);
  const deptStudentIds = new Set(deptStudents.map(s => s.id));
  const deptMarks      = marks.filter(m => deptStudentIds.has(m.student_id));
  const deptAtt        = attendance.filter(a => deptStudentIds.has(a.student_id));
  const deptEff        = allEff.filter(e => e.department === facultyDept);

  const visibleStudents = deptStudents.filter(s =>
    !searchQ ||
    s.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.rollno?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredMarks = deptMarks
    .filter(m => markSemFilter   === "All" || m.semester === markSemFilter)
    .filter(m => markGradeFilter === "All" || m.grade    === markGradeFilter);

  const filteredAtt = attSemFilter === "All" ? deptAtt : deptAtt.filter(a => a.semester === attSemFilter);

  const avgCgpa = deptEff.length
    ? (deptEff.reduce((s,e) => s + parseFloat(e.cgpa||0), 0) / deptEff.length).toFixed(2)
    : "—";

  const lowAttStudents = deptStudents.filter(s => {
    const rows = deptAtt.filter(a => a.student_id === s.id);
    if (!rows.length) return false;
    return rows.reduce((sum,r) => sum + Number(r.attendance_percentage), 0) / rows.length < 75;
  });

  const bandCounts = { Excellent:0, Good:0, "Needs Improvement":0, Weak:0 };
  deptEff.forEach(e => { if (bandCounts[e.band] !== undefined) bandCounts[e.band]++; });

  const semAvgData = SEMESTERS.map(sem => {
    const sm = deptMarks.filter(m => m.semester === sem);
    const avg = sm.length ? sm.reduce((s,m) => s + Number(m.marks_scored), 0) / sm.length : 0;
    return { sem: sem.replace("Sem ","S"), avg: Math.round(avg*10)/10 };
  }).filter(d => d.avg > 0);

  const classAvgEff = deptEff.length
    ? (deptEff.reduce((s,e) => s + Number(e.finalScore||0), 0) / deptEff.length).toFixed(1)
    : "—";

  const dirStudents = deptStudents
    .filter(s =>
      !dirSearchQ ||
      s.name?.toLowerCase().includes(dirSearchQ.toLowerCase()) ||
      s.rollno?.toLowerCase().includes(dirSearchQ.toLowerCase()) ||
      s.email?.toLowerCase().includes(dirSearchQ.toLowerCase()) ||
      (s.phone||"").includes(dirSearchQ)
    )
    .map(s => {
      const eff = deptEff.find(e => e.studentId === s.id || e.id === s.id);
      return {
        ...s,
        effScore:    eff?.finalScore    ?? null,
        deptRank:    eff?.deptRank      ?? null,
        deptTotal:   eff?.deptTotal     ?? null,
        overallRank: eff?.overallRank   ?? null,
        overallTotal:eff?.overallTotal  ?? null,
        band:        eff?.band          ?? null,
      };
    });

  /* ── Helpers: paginate ── */
  const paginate = (arr, page, size) => arr.slice((page-1)*size, page*size);

  const MENU = [
    { label:"Dashboard",       icon:<DashboardIcon/> },
    { label:"My Students",     icon:<PeopleIcon/> },
    { label:"Directory",       icon:<TableChartIcon/> },
    { label:"Marks",           icon:<GradeIcon/> },
    { label:"Attendance",      icon:<EventAvailableIcon/> },
    { label:"Performance",     icon:<BarChartIcon/> },
    { label:"Announcements",   icon:<AnnouncementIcon/> },
    { label:"Change Password", icon:<LockIcon/> },
  ];

  if (loading) return (
    <Box sx={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:2, bgcolor:"#f4f6f9" }}>
      <Box sx={{ width:48, height:48, borderRadius:"50%",
        border:"4px solid #e2e8f0", borderTopColor:"#1e3c72",
        animation:"spin 0.8s linear infinite",
        "@keyframes spin":{ to:{ transform:"rotate(360deg)" } } }}/>
      <Typography sx={{ fontFamily:FONT, color:"#1e3c72", fontWeight:600 }}>Loading Faculty Portal…</Typography>
    </Box>
  );

  /* ══════════ DASHBOARD ══════════ */
  const renderDashboard = () => (
    <Box>
      <Box sx={{ ...S.card, background:"linear-gradient(90deg,#1e3c72,#2a5298)", color:"#fff", mb:3, p:"20px 28px" }}>
        <Typography sx={{ fontWeight:700, fontSize:"20px", fontFamily:FONT }}>Welcome, {facultyName} </Typography>
        <Typography sx={{ fontSize:"13px", opacity:0.8, mt:0.5, fontFamily:FONT }}>Mentor — {facultyDept} Department</Typography>
      </Box>

      <Box sx={{ display:"flex", gap:3, flexWrap:"wrap", mb:3 }}>
        <KpiCard label="My Students"    value={deptStudents.length}   color="#2563eb"/>
        <KpiCard label="Avg CGPA"       value={avgCgpa}               color="#16a34a"/>
        <KpiCard label="Class Avg Eff." value={classAvgEff}           color="#7c3aed" sub="out of 100"/>
        <KpiCard label="Low Attendance" value={lowAttStudents.length} color="#dc2626" sub="< 75%"/>
        <KpiCard label="Announcements"  value={announcements.length}  color="#0891b2"/>
      </Box>

      <Box sx={{ display:"flex", gap:3, flexWrap:"wrap", mb:3 }}>
        <Box sx={{ ...S.card, flex:"1 1 240px" }}>
          <Typography sx={{ fontWeight:700, fontSize:"15px", fontFamily:FONT, mb:2 }}>Performance Bands</Typography>
          {Object.entries(bandCounts).map(([band,count]) => (
            <Box key={band} sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1.2 }}>
              <Box sx={{ width:10, height:10, borderRadius:"50%", bgcolor:bandColor(band), flexShrink:0 }}/>
              <Typography sx={{ flex:1, fontSize:"13px", fontFamily:FONT }}>{band}</Typography>
              <Box sx={{ width:80, bgcolor:"#f1f5f9", borderRadius:"4px", height:7 }}>
                <Box sx={{ width:`${deptStudents.length ? Math.round((count/deptStudents.length)*100) : 0}%`,
                  bgcolor:bandColor(band), height:7, borderRadius:"4px", transition:"width .3s" }}/>
              </Box>
              <Typography sx={{ fontSize:"12px", color:"#64748b", minWidth:20, fontFamily:FONT }}>{count}</Typography>
            </Box>
          ))}
        </Box>

        {semAvgData.length > 0 && (
          <Box sx={{ ...S.card, flex:"2 1 280px" }}>
            <Typography sx={{ fontWeight:700, fontSize:"15px", fontFamily:FONT, mb:2 }}>Avg Marks by Semester</Typography>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={semAvgData} barSize={30}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2a5298"/>
                    <stop offset="100%" stopColor="#1e3c72"/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="sem" tick={{ fontFamily:FONT, fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontFamily:FONT, fontSize:11 }} axisLine={false} tickLine={false}/>
                <RTooltip contentStyle={{ fontFamily:FONT, fontSize:12 }}/>
                <Bar dataKey="avg" radius={[4,4,0,0]} fill="url(#barGrad)"/>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>

      {lowAttStudents.length > 0 && (
        <Box sx={{ ...S.card, borderLeft:"4px solid #dc2626", bgcolor:"#fef2f2", mb:3 }}>
          <Typography sx={{ fontWeight:700, fontSize:"14px", color:"#dc2626", fontFamily:FONT, mb:1.5 }}>
            ⚠ Students Below 75% Attendance ({lowAttStudents.length})
          </Typography>
          <Box sx={{ display:"flex", gap:1, flexWrap:"wrap" }}>
            {lowAttStudents.map(s => (
              <span key={s.id} onClick={() => { setTab("My Students"); openStudent(s); }}
                style={{ background:"#fee2e2", color:"#dc2626", borderRadius:"999px",
                  padding:"4px 12px", fontSize:"12px", cursor:"pointer", fontFamily:FONT }}>
                {s.name} ({s.rollno})
              </span>
            ))}
          </Box>
        </Box>
      )}

      {announcements.length > 0 && (
        <Box sx={S.card}>
          <Typography sx={{ fontWeight:700, fontSize:"15px", fontFamily:FONT, mb:1.5 }}>Recent Announcements</Typography>
          {announcements.slice(0,3).map(a => (
            <Box key={a.id} sx={{ py:1.2, borderBottom:"1px solid #f1f5f9" }}>
              <Typography sx={{ fontWeight:600, fontSize:"13px", fontFamily:FONT }}>{a.title}</Typography>
              <Typography sx={{ color:"#64748b", fontSize:"12px", mt:0.3 }}>
                {a.message?.slice(0,100)}{a.message?.length > 100 ? "…" : ""}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  /* ══════════ MY STUDENTS ══════════ */
  const renderStudents = () => {
    const kf     = (row,col) => row[col] ?? "";
    const sorted = stuSort.sort(visibleStudents, kf);
    const pages  = Math.max(1, Math.ceil(sorted.length / stuSize));
    const slice  = paginate(sorted, stuPage, stuSize);

    return (
      <Box sx={{ display:"flex", gap:3, alignItems:"flex-start" }}>
        <Box sx={{ flex: selStudent ? "0 0 340px" : "1 1 100%", transition:"all .2s" }}>
          <Box sx={{ ...S.card, padding:0, overflow:"hidden" }}>
            <Box sx={{ padding:"20px 24px 16px" }}>
              <Typography variant="h6" sx={{ fontWeight:700, mb:2, fontFamily:FONT }}>
                My Students — {facultyDept}
                <span style={{ fontWeight:400, fontSize:"14px", color:"#64748b", marginLeft:8 }}>({deptStudents.length})</span>
              </Typography>
              <input placeholder="Search name, roll no, email…" value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{ ...S.inp, marginBottom:0 }}/>
            </Box>
            <Box sx={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)" }}>
                    <SortTh label="Name"    col="name"   sortCol={stuSort.sortCol} sortDir={stuSort.sortDir} onToggle={stuSort.toggle}/>
                    <SortTh label="Roll No" col="rollno" sortCol={stuSort.sortCol} sortDir={stuSort.sortDir} onToggle={stuSort.toggle}/>
                    <SortTh label="Email"   col="email"  sortCol={stuSort.sortCol} sortDir={stuSort.sortDir} onToggle={stuSort.toggle}/>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((s,i) => (
                    <tr key={s.id} onClick={() => openStudent(s)}
                      style={{ background: selStudent?.id===s.id ? "#eff6ff" : i%2===0 ? "#fff" : "#f8fafc",
                        cursor:"pointer", transition:"background .15s" }}
                      onMouseEnter={e => { if (selStudent?.id!==s.id) e.currentTarget.style.background="#f0f9ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = selStudent?.id===s.id ? "#eff6ff" : i%2===0 ? "#fff" : "#f8fafc"; }}>
                      <td style={S.td}><b>{s.name}</b></td>
                      <td style={{ ...S.td, color:"#475569" }}>{s.rollno}</td>
                      <td style={{ ...S.td, color:"#475569", fontSize:"12px" }}>{s.email}</td>
                      <td style={{ padding:"12px 16px" }}><PersonSearchIcon sx={{ color:"#2563eb", fontSize:18 }}/></td>
                    </tr>
                  ))}
                  {!slice.length && (
                    <tr><td colSpan={4} style={{ ...S.td, textAlign:"center", padding:32, color:"#94a3b8" }}>No students found</td></tr>
                  )}
                </tbody>
              </table>
            </Box>
            <PaginationBar page={stuPage} pages={pages} pageSize={stuSize}
              changeSize={s => { setStuSize(s); setStuPage(1); }}
              setPage={setStuPage} total={sorted.length}/>
          </Box>
        </Box>

        {selStudent && (
          <Box sx={{ flex:1, display:"flex", flexDirection:"column", gap:2.5 }}>
            <Box sx={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <Box>
                <Typography sx={{ fontWeight:700, fontSize:"18px", fontFamily:FONT }}>{selStudent.name}</Typography>
                <Typography sx={{ color:"#64748b", fontSize:"13px", fontFamily:FONT }}>
                  {selStudent.rollno} · {selStudent.email} · {selStudent.department}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelStudent(null)} size="small">
                <CloseIcon sx={{ color:"#64748b" }}/>
              </IconButton>
            </Box>

            {stuEff && (
              <Box sx={{ ...S.card, display:"flex", gap:3, flexWrap:"wrap" }}>
                <Box sx={{ flex:1, minWidth:200 }}>
                  <Typography sx={{ fontWeight:700, fontSize:"14px", fontFamily:FONT, mb:1.5 }}>Efficiency Profile</Typography>
                  <ResponsiveContainer width="100%" height={190}>
                    <RadarChart data={[
                      { subject:"Skills",       A: stuEff.skillScore       || 0 },
                      { subject:"Achievements", A: stuEff.achievementScore || 0 },
                      { subject:"Activities",   A: stuEff.activityScore    || 0 },
                      { subject:"CGPA",         A: stuEff.cgpaScore        || 0 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontFamily:FONT, fontSize:11 }}/>
                      <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }}/>
                      <Radar dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display:"flex", flexDirection:"column", gap:1.5, minWidth:160, justifyContent:"center" }}>
                  <Box sx={{ background:bandBg(stuEff.band), borderRadius:"10px", p:"12px 18px", textAlign:"center" }}>
                    <Typography sx={{ fontSize:"11px", color:"#64748b", fontFamily:FONT }}>Score</Typography>
                    <Typography sx={{ fontSize:"30px", fontWeight:700, color:bandColor(stuEff.band), lineHeight:1, fontFamily:FONT }}>
                      {stuEff.finalScore}
                    </Typography>
                    <Chip label={stuEff.band} color={bandColor(stuEff.band)} bg={bandBg(stuEff.band)}/>
                  </Box>
                  <Box sx={{ display:"flex", gap:1 }}>
                    {[
                      { lbl:"Dept Rank", val:`#${stuEff.deptRank}/${stuEff.deptTotal}` },
                      { lbl:"Overall",   val:`#${stuEff.overallRank}/${stuEff.overallTotal}` },
                    ].map(x => (
                      <Box key={x.lbl} sx={{ flex:1, ...S.card, textAlign:"center", p:"10px 8px", boxShadow:"none", border:"1px solid #e2e8f0" }}>
                        <Typography sx={{ fontSize:"10px", color:"#94a3b8", fontFamily:FONT }}>{x.lbl}</Typography>
                        <Typography sx={{ fontWeight:700, fontSize:"13px", fontFamily:FONT }}>{x.val}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ ...S.card, textAlign:"center", p:"10px", boxShadow:"none", border:"1px solid #e2e8f0" }}>
                    <Typography sx={{ fontSize:"10px", color:"#94a3b8", fontFamily:FONT }}>CGPA</Typography>
                    <Typography sx={{ fontWeight:700, fontSize:"22px", color:"#2563eb", fontFamily:FONT }}>{stuEff.cgpa}</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {stuMarks && stuMarks.semesters?.length > 0 && (
              <Box sx={S.card}>
                <Typography sx={{ fontWeight:700, fontSize:"14px", fontFamily:FONT, mb:2 }}>Marks by Semester</Typography>
                {stuMarks.semesters.map(sem => (
                  <Box key={sem.semester} sx={{ mb:2 }}>
                    <Box sx={{ display:"flex", justifyContent:"space-between", mb:1 }}>
                      <Typography sx={{ fontWeight:600, fontSize:"13px", fontFamily:FONT }}>{sem.semester}</Typography>
                      <Typography sx={{ fontSize:"12px", color:"#2563eb", fontFamily:FONT }}>SGPA: <b>{sem.sgpa}</b></Typography>
                    </Box>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          {["Subject","Marks","Grade"].map(h => (
                            <th key={h} style={{ ...S.th, color:"#475569", background:"transparent", fontSize:"11px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sem.subjects.map(sub => (
                          <tr key={sub.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                            <td style={S.td}>{sub.subject_name}</td>
                            <td style={S.td}>{sub.marks_scored}</td>
                            <td style={{ padding:"10px 16px" }}>
                              <Chip label={sub.grade}
                                color={sub.grade==="F" ? "#dc2626" : "#16a34a"}
                                bg={sub.grade==="F"    ? "#fee2e2" : "#dcfce7"}/>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                ))}
                <Typography sx={{ textAlign:"right", fontSize:"13px", fontFamily:FONT, mt:1 }}>
                  Overall CGPA: <b style={{ color:"#2563eb" }}>{stuMarks.cgpa}</b>
                </Typography>
              </Box>
            )}

            {stuAtt.length > 0 && (
              <Box sx={S.card}>
                <Typography sx={{ fontWeight:700, fontSize:"14px", fontFamily:FONT, mb:2 }}>Attendance</Typography>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {["Semester","Present","Total","Percentage"].map(h => (
                        <th key={h} style={{ ...S.th, color:"#475569", background:"transparent" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stuAtt.map(a => (
                      <tr key={a.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                        <td style={S.td}>{a.semester}</td>
                        <td style={S.td}>{a.present_days}</td>
                        <td style={S.td}>{a.total_days}</td>
                        <td style={{ padding:"10px 16px" }}>
                          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                            <Box sx={{ width:60, bgcolor:"#f1f5f9", borderRadius:"4px", height:6 }}>
                              <Box sx={{ width:`${Math.min(a.attendance_percentage,100)}%`,
                                bgcolor: a.attendance_percentage>=75 ? "#16a34a" : "#dc2626",
                                height:6, borderRadius:"4px" }}/>
                            </Box>
                            <Chip label={a.attendance_percentage+"%"}
                              color={a.attendance_percentage>=75 ? "#16a34a" : "#dc2626"}
                              bg={a.attendance_percentage>=75    ? "#dcfce7" : "#fee2e2"}/>
                          </Box>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}

            <Box sx={S.card}>
              <Typography sx={{ fontWeight:700, fontSize:"14px", fontFamily:FONT, mb:2,
                display:"flex", alignItems:"center", gap:1 }}>
                <NoteAddIcon sx={{ color:"#2563eb", fontSize:18 }}/> Mentor Notes
              </Typography>
              <Box sx={{ display:"flex", gap:1.5, mb:2 }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a private note about this student…" rows={3}
                  style={{ ...S.inp, marginBottom:0, resize:"vertical", flex:1 }}/>
                <button onClick={addNote} disabled={noteSaving || !noteText.trim()}
                  style={{ ...S.btn, width:"auto", padding:"10px 20px",
                    opacity:(!noteText.trim() || noteSaving) ? 0.5 : 1 }}>
                  {noteSaving ? "Saving…" : "Add"}
                </button>
              </Box>
              {stuNotes.length > 0
                ? stuNotes.map((n,i) => (
                    <Box key={i} sx={{ bgcolor:"#f8fafc", borderRadius:"8px", p:"10px 14px", mb:1, borderLeft:"3px solid #2563eb" }}>
                      <Typography sx={{ fontSize:"13px", fontFamily:FONT }}>{n.note}</Typography>
                      {n.created_at && (
                        <Typography sx={{ fontSize:"11px", color:"#94a3b8", mt:0.5, fontFamily:FONT }}>
                          {new Date(n.created_at).toLocaleString("en-IN",{ day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                        </Typography>
                      )}
                    </Box>
                  ))
                : <Typography sx={{ color:"#94a3b8", fontSize:"13px", fontFamily:FONT }}>No notes yet.</Typography>
              }
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  /* ══════════ DIRECTORY ══════════ */
  const renderDirectory = () => {
    const kf = (row,col) => {
      if (col==="effScore")    return row.effScore    ?? -1;
      if (col==="deptRank")    return row.deptRank    ?? 9999;
      if (col==="overallRank") return row.overallRank ?? 9999;
      return row[col] ?? "";
    };
    const sorted = dirSort.sort(dirStudents, kf);
    const pages  = Math.max(1, Math.ceil(sorted.length / dirSize));
    const slice  = paginate(sorted, dirPage, dirSize);

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight:800, mb:1, fontFamily:FONT }}>
          Student Directory — {facultyDept}
        </Typography>
        <Typography sx={{ color:"#64748b", fontSize:"13px", mb:3, fontFamily:FONT }}>
          {deptStudents.length} students · Name · Roll No · Mail ID · Phone No · Efficiency Rankings
        </Typography>
        <Box sx={{ display:"flex", gap:2, mb:3, flexWrap:"wrap" }}>
          <input placeholder="Search name, roll no, email or phone…" value={dirSearchQ}
            onChange={e => { setDirSearchQ(e.target.value); setDirPage(1); }}
            style={{ ...S.inp, marginBottom:0, maxWidth:400, flex:"1 1 280px" }}/>
          <Typography sx={{ alignSelf:"center", fontSize:"13px", color:"#64748b", fontFamily:FONT }}>
            Showing {sorted.length} of {deptStudents.length}
          </Typography>
        </Box>
        <Box sx={{ ...S.card, p:0, overflow:"hidden" }}>
          <Box sx={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)" }}>
                  <th style={{ ...S.th, padding:"12px 14px" }}>#</th>
                  <SortTh label="Name"         col="name"        sortCol={dirSort.sortCol} sortDir={dirSort.sortDir} onToggle={dirSort.toggle}/>
                  <SortTh label="Roll No"      col="rollno"      sortCol={dirSort.sortCol} sortDir={dirSort.sortDir} onToggle={dirSort.toggle}/>
                  <SortTh label="Mail ID"      col="email"       sortCol={dirSort.sortCol} sortDir={dirSort.sortDir} onToggle={dirSort.toggle}/>
                  <th style={S.th}>Phone No</th>
                  <SortTh label="Eff. Score"   col="effScore"    sortCol={dirSort.sortCol} sortDir={dirSort.sortDir} onToggle={dirSort.toggle}/>
                  <SortTh label="Dept Rank"    col="deptRank"    sortCol={dirSort.sortCol} sortDir={dirSort.sortDir} onToggle={dirSort.toggle}/>
                  <SortTh label="Overall Rank" col="overallRank" sortCol={dirSort.sortCol} sortDir={dirSort.sortDir} onToggle={dirSort.toggle}/>
                </tr>
              </thead>
              <tbody>
                {slice.map((s,i) => (
                  <tr key={s.id}
                    style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0 ? "#fff" : "#f8fafc" }}
                    onMouseEnter={e => e.currentTarget.style.background="#f0f9ff"}
                    onMouseLeave={e => e.currentTarget.style.background = i%2===0 ? "#fff" : "#f8fafc"}>
                    <td style={{ ...S.td, color:"#94a3b8", padding:"11px 14px" }}>{(dirPage-1)*dirSize+i+1}</td>
                    <td style={{ ...S.td, fontWeight:700, padding:"11px 14px" }}>{s.name}</td>
                    <td style={{ ...S.td, fontFamily:"monospace", fontSize:"12px", padding:"11px 14px" }}>{s.rollno}</td>
                    <td style={{ ...S.td, color:"#475569", fontSize:"12px", padding:"11px 14px" }}>{s.email}</td>
                    <td style={{ ...S.td, color:"#64748b", padding:"11px 14px" }}>{s.phone||"—"}</td>
                    <td style={{ ...S.td, padding:"11px 14px" }}>
                      {s.effScore !== null ? (
                        <span style={{ fontWeight:700, color:bandColor(s.band||""), fontSize:"14px" }}>
                          {s.effScore}
                          {s.band && (
                            <span style={{ marginLeft:"6px", fontSize:"10px", fontWeight:600,
                              background:bandColor(s.band)+"18", color:bandColor(s.band),
                              padding:"1px 6px", borderRadius:"999px" }}>
                              {s.band}
                            </span>
                          )}
                        </span>
                      ) : <span style={{ color:"#94a3b8", fontSize:"12px" }}>—</span>}
                    </td>
                    <td style={{ ...S.td, padding:"11px 14px" }}>
                      {s.deptRank !== null ? (
                        <span style={{ fontWeight:700, color:"#6d28d9" }}>
                          #{s.deptRank}<span style={{ color:"#94a3b8", fontWeight:400, fontSize:"11px" }}>/{s.deptTotal}</span>
                        </span>
                      ) : <span style={{ color:"#94a3b8", fontSize:"12px" }}>—</span>}
                    </td>
                    <td style={{ ...S.td, padding:"11px 14px" }}>
                      {s.overallRank !== null ? (
                        <span style={{ fontWeight:700, color:"#1d4ed8" }}>
                          #{s.overallRank}<span style={{ color:"#94a3b8", fontWeight:400, fontSize:"11px" }}>/{s.overallTotal}</span>
                        </span>
                      ) : <span style={{ color:"#94a3b8", fontSize:"12px" }}>—</span>}
                    </td>
                  </tr>
                ))}
                {!slice.length && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign:"center", padding:32, color:"#94a3b8" }}>No students found</td></tr>
                )}
              </tbody>
            </table>
          </Box>
          <PaginationBar page={dirPage} pages={pages} pageSize={dirSize}
            changeSize={s => { setDirSize(s); setDirPage(1); }}
            setPage={setDirPage} total={sorted.length}/>
        </Box>
      </Box>
    );
  };

  /* ══════════ MARKS ══════════ */
  const renderMarks = () => {
    const availSems = ["All", ...SEMESTERS.filter(s => deptMarks.some(m => m.semester===s))];
    const kf = (row,col) => {
      if (col==="rollno") return students.find(s => s.id===row.student_id)?.rollno ?? "";
      return row[col] ?? "";
    };
    const sorted = markSort.sort(filteredMarks, kf);
    const pages  = Math.max(1, Math.ceil(sorted.length / markSize));
    const slice  = paginate(sorted, markPage, markSize);

    return (
      <Box sx={{ ...S.card, padding:0, overflow:"hidden" }}>
        <Box sx={{ padding:"20px 24px 0" }}>
          <Typography variant="h6" sx={{ fontWeight:700, mb:2, fontFamily:FONT }}>
            Marks — {facultyDept}
            <span style={{ fontWeight:400, fontSize:"14px", color:"#64748b", marginLeft:8 }}>({filteredMarks.length} records)</span>
          </Typography>

          {/* Semester filter */}
          <Box sx={{ display:"flex", gap:1, flexWrap:"wrap", mb:2, alignItems:"center" }}>
            <Typography sx={{ fontSize:"12px", fontWeight:600, color:"#64748b", fontFamily:FONT, mr:0.5 }}>Semester:</Typography>
            {availSems.map(s => (
              <button key={s} onClick={() => { setMarkSemFilter(s); setMarkPage(1); }}
                style={{ padding:"5px 14px", borderRadius:"999px", border:"none",
                  background: markSemFilter===s ? "linear-gradient(90deg,#1e3c72,#2a5298)" : "#f1f5f9",
                  color: markSemFilter===s ? "#fff" : "#475569",
                  cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:600 }}>
                {s}
              </button>
            ))}
          </Box>

          {/* Grade filter — O / A+ / A / B+ / B / C / F */}
          <Box sx={{ display:"flex", gap:1, flexWrap:"wrap", mb:2, alignItems:"center" }}>
            <Typography sx={{ fontSize:"12px", fontWeight:600, color:"#64748b", fontFamily:FONT, mr:0.5 }}>Grade:</Typography>
            {GRADE_OPTIONS.map(g => (
              <button key={g} onClick={() => { setMarkGradeFilter(g); setMarkPage(1); }}
                style={{ padding:"5px 14px", borderRadius:"999px", border:"none",
                  background: markGradeFilter===g ? "linear-gradient(90deg,#1e3c72,#2a5298)" : "#f1f5f9",
                  color: markGradeFilter===g ? "#fff" : "#475569",
                  cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:600 }}>
                {g}
              </button>
            ))}
          </Box>
        </Box>

        <Box sx={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)" }}>
                <SortTh label="Student"  col="student_name" sortCol={markSort.sortCol} sortDir={markSort.sortDir} onToggle={markSort.toggle}/>
                <SortTh label="Roll No"  col="rollno"       sortCol={markSort.sortCol} sortDir={markSort.sortDir} onToggle={markSort.toggle}/>
                <SortTh label="Semester" col="semester"     sortCol={markSort.sortCol} sortDir={markSort.sortDir} onToggle={markSort.toggle}/>
                <SortTh label="Subject"  col="subject_name" sortCol={markSort.sortCol} sortDir={markSort.sortDir} onToggle={markSort.toggle}/>
                <SortTh label="Marks"    col="marks_scored" sortCol={markSort.sortCol} sortDir={markSort.sortDir} onToggle={markSort.toggle}/>
                <SortTh label="Grade"    col="grade"        sortCol={markSort.sortCol} sortDir={markSort.sortDir} onToggle={markSort.toggle}/>
              </tr>
            </thead>
            <tbody>
              {slice.map((m,i) => (
                <tr key={i} style={{ background: i%2===0 ? "#fff" : "#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
                  <td style={S.td}><b>{m.student_name}</b></td>
                  <td style={{ ...S.td, color:"#475569" }}>{students.find(s => s.id===m.student_id)?.rollno || "—"}</td>
                  <td style={{ ...S.td, color:"#475569" }}>{m.semester}</td>
                  <td style={S.td}>{m.subject_name}</td>
                  <td style={{ ...S.td, fontWeight:700 }}>{m.marks_scored}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <Chip label={m.grade}
                      color={m.grade==="F" ? "#dc2626" : "#16a34a"}
                      bg={m.grade==="F"    ? "#fee2e2" : "#dcfce7"}/>
                  </td>
                </tr>
              ))}
              {!slice.length && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign:"center", padding:32, color:"#94a3b8" }}>No marks data</td></tr>
              )}
            </tbody>
          </table>
        </Box>
        <PaginationBar page={markPage} pages={pages} pageSize={markSize}
          changeSize={s => { setMarkSize(s); setMarkPage(1); }}
          setPage={setMarkPage} total={sorted.length}/>
      </Box>
    );
  };

  /* ══════════ ATTENDANCE ══════════ */
  const renderAttendance = () => {
    const availSems = ["All", ...SEMESTERS.filter(s => deptAtt.some(a => a.semester===s))];
    const kf = (row,col) => {
      if (col==="rollno") return students.find(s => s.id===row.student_id)?.rollno ?? "";
      return row[col] ?? "";
    };
    const sorted = attSort.sort(filteredAtt, kf);
    const pages  = Math.max(1, Math.ceil(sorted.length / attSize));
    const slice  = paginate(sorted, attPage, attSize);

    return (
      <Box sx={{ ...S.card, padding:0, overflow:"hidden" }}>
        <Box sx={{ padding:"20px 24px 0" }}>
          <Typography variant="h6" sx={{ fontWeight:700, mb:2, fontFamily:FONT }}>Attendance — {facultyDept}</Typography>
          <Box sx={{ display:"flex", gap:1, flexWrap:"wrap", mb:2 }}>
            {availSems.map(s => (
              <button key={s} onClick={() => { setAttSemFilter(s); setAttPage(1); }}
                style={{ padding:"5px 16px", borderRadius:"999px", border:"none",
                  background: attSemFilter===s ? "linear-gradient(90deg,#1e3c72,#2a5298)" : "#f1f5f9",
                  color: attSemFilter===s ? "#fff" : "#475569",
                  cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:600 }}>
                {s}
              </button>
            ))}
          </Box>
        </Box>
        <Box sx={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)" }}>
                <SortTh label="Student"    col="student_name"          sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                <SortTh label="Roll No"    col="rollno"                sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                <SortTh label="Semester"   col="semester"              sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                <SortTh label="Present"    col="present_days"          sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                <SortTh label="Total"      col="total_days"            sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                <SortTh label="Percentage" col="attendance_percentage" sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
              </tr>
            </thead>
            <tbody>
              {slice.map((a,i) => (
                <tr key={i} style={{ background: i%2===0 ? "#fff" : "#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
                  <td style={S.td}><b>{a.student_name}</b></td>
                  <td style={{ ...S.td, color:"#475569" }}>{students.find(s => s.id===a.student_id)?.rollno || "—"}</td>
                  <td style={{ ...S.td, color:"#475569" }}>{a.semester}</td>
                  <td style={S.td}>{a.present_days}</td>
                  <td style={S.td}>{a.total_days}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
                      <Box sx={{ width:70, bgcolor:"#f1f5f9", borderRadius:"4px", height:7 }}>
                        <Box sx={{ width:`${Math.min(a.attendance_percentage,100)}%`,
                          bgcolor: a.attendance_percentage>=75 ? "#16a34a" : "#dc2626",
                          height:7, borderRadius:"4px" }}/>
                      </Box>
                      <Chip label={a.attendance_percentage+"%"}
                        color={a.attendance_percentage>=75 ? "#16a34a" : "#dc2626"}
                        bg={a.attendance_percentage>=75    ? "#dcfce7" : "#fee2e2"}/>
                    </Box>
                  </td>
                </tr>
              ))}
              {!slice.length && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign:"center", padding:32, color:"#94a3b8" }}>No attendance data</td></tr>
              )}
            </tbody>
          </table>
        </Box>
        <PaginationBar page={attPage} pages={pages} pageSize={attSize}
          changeSize={s => { setAttSize(s); setAttPage(1); }}
          setPage={setAttPage} total={sorted.length}/>
      </Box>
    );
  };

  /* ══════════ PERFORMANCE ══════════ */
  const renderPerformance = () => {
    const kf        = (row,col) => row[col] ?? "";
    const baseSorted = [...deptEff].sort((a,b) => a.name.localeCompare(b.name));
    const sorted    = effSort.sortCol ? effSort.sort(deptEff, kf) : baseSorted;
    const pages     = Math.max(1, Math.ceil(sorted.length / effSize));
    const slice     = paginate(sorted, effPage, effSize);

    return (
      <Box sx={{ display:"flex", flexDirection:"column", gap:3 }}>
        <Box sx={{ display:"flex", gap:3, flexWrap:"wrap" }}>
          <KpiCard label="Class Avg Efficiency" value={classAvgEff} color="#7c3aed" sub="out of 100"/>
          <KpiCard label="Total Students"       value={deptEff.length} color="#2563eb"/>
          <KpiCard label="Excellent"            value={deptEff.filter(e => e.band==="Excellent").length} color="#16a34a"/>
          <KpiCard label="Needs Attention"      value={deptEff.filter(e => e.band==="Weak" || e.band==="Needs Improvement").length} color="#dc2626"/>
        </Box>

        {deptEff.length > 0 && (
          <Box sx={S.card}>
            <Typography sx={{ fontWeight:700, fontSize:"15px", fontFamily:FONT, mb:2 }}>Score Comparison</Typography>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={sorted.slice(0,15).map(e => ({ name: e.name.split(" ")[0], score: e.finalScore, band: e.band }))}
                barSize={24}>
                <XAxis dataKey="name" tick={{ fontFamily:FONT, fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontFamily:FONT, fontSize:11 }} axisLine={false} tickLine={false}/>
                <RTooltip contentStyle={{ fontFamily:FONT, fontSize:12 }}/>
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {sorted.slice(0,15).map((e,i) => <Cell key={i} fill={bandColor(e.band)}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Box sx={{ ...S.card, padding:0, overflow:"hidden" }}>
          <Box sx={{ padding:"20px 24px 0" }}>
            <Typography variant="h6" sx={{ fontWeight:700, mb:2, fontFamily:FONT }}>
              Efficiency Scores — {facultyDept}
            </Typography>
          </Box>
          <Box sx={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)" }}>
                  <SortTh label="Student"      col="name"        sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                  <SortTh label="Roll No"      col="rollno"      sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                  <SortTh label="CGPA"         col="cgpa"        sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                  <SortTh label="Score / 100"  col="finalScore"  sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                  <SortTh label="Dept Rank"    col="deptRank"    sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                  <SortTh label="Overall Rank" col="overallRank" sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                  <th style={S.th}>Band</th>
                  <th style={S.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((e,i) => (
                  <React.Fragment key={e.id}>
                    <tr style={{ background: i%2===0 ? "#fff" : "#f8fafc", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }}
                      onClick={() => setExpandedEff(expandedEff===e.id ? null : e.id)}>
                      <td style={S.td}><b>{e.name}</b></td>
                      <td style={{ ...S.td, color:"#475569" }}>{e.rollno}</td>
                      <td style={S.td}>{e.cgpa}</td>
                      <td style={{ ...S.td, fontWeight:700, color:"#2563eb" }}>{e.finalScore}</td>
                      <td style={S.td}>#{e.deptRank}/{e.deptTotal}</td>
                      <td style={S.td}>#{e.overallRank}/{e.overallTotal}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <Chip label={e.band} color={bandColor(e.band)} bg={bandBg(e.band)}/>
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ color:"#2563eb", fontSize:"12px", fontFamily:FONT }}>
                          {expandedEff===e.id ? "▲ Hide" : "▼ Peer"}
                        </span>
                      </td>
                    </tr>

                    {expandedEff===e.id && (
                      <tr style={{ background:"#f0f7ff" }}>
                        <td colSpan={8} style={{ padding:"16px 20px" }}>
                          <Typography sx={{ fontWeight:700, fontSize:"13px", fontFamily:FONT, mb:1.5, color:"#1e3c72" }}>
                            Peer Comparison — {facultyDept}
                          </Typography>
                          <Box sx={{ display:"flex", gap:3, flexWrap:"wrap", mb:2 }}>
                            {[
                              { label:"Skills",       scoreKey:"skillScore",       max:30, color:"#7c3aed" },
                              { label:"Achievements", scoreKey:"achievementScore", max:20, color:"#f59e0b" },
                              { label:"Activities",   scoreKey:"activityScore",    max:20, color:"#06b6d4" },
                              { label:"CGPA",         scoreKey:"cgpaScore",        max:30, color:"#16a34a" },
                            ].map(({ label, scoreKey, max, color }) => {
                              const studentVal = Number(e[scoreKey] || 0);

                              /* FIX: correct class average per parameter */
                              const classAvgParam = deptEff.length > 0
                                ? (deptEff.reduce((sum,p) => sum + Number(p[scoreKey] || 0), 0) / deptEff.length).toFixed(1)
                                : "0.0";

                              return (
                                <Box key={label} sx={{ flex:"1 1 140px", bgcolor:"#fff", borderRadius:"10px",
                                  p:"12px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                                  <Typography sx={{ fontSize:"11px", color:"#64748b", fontFamily:FONT, fontWeight:600, mb:0.5 }}>
                                    {label}
                                  </Typography>
                                  <Typography sx={{ fontSize:"20px", fontWeight:700, color, fontFamily:FONT }}>
                                    {studentVal.toFixed(1)}
                                    <span style={{ fontSize:"11px", color:"#94a3b8" }}>/{max}</span>
                                  </Typography>
                                  <Typography sx={{ fontSize:"11px", color:"#64748b", fontFamily:FONT, mt:0.3 }}>
                                    Class avg: <b>{classAvgParam}</b>
                                  </Typography>
                                  <Box sx={{ mt:1, height:5, bgcolor:"#f1f5f9", borderRadius:"3px" }}>
                                    <Box sx={{ width:`${Math.min((studentVal/max)*100, 100)}%`,
                                      height:5, bgcolor:color, borderRadius:"3px" }}/>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                          <button
                            onClick={() => {
                              const stu = deptStudents.find(s => s.id===e.id);
                              if (stu) { setTab("My Students"); openStudent(stu); }
                            }}
                            style={{ ...S.btn, width:"auto", padding:"8px 20px", fontSize:"12px" }}>
                            Open Student Profile
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!slice.length && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign:"center", padding:32, color:"#94a3b8" }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </Box>
          <PaginationBar page={effPage} pages={pages} pageSize={effSize}
            changeSize={s => { setEffSize(s); setEffPage(1); }}
            setPage={setEffPage} total={sorted.length}/>
        </Box>
      </Box>
    );
  };

  /* ══════════ ANNOUNCEMENTS ══════════ */
  const renderAnnouncements = () => (
    <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>
      <Typography variant="h6" sx={{ fontWeight:700, fontFamily:FONT }}>Announcements</Typography>
      {!announcements.length && (
        <Box sx={{ ...S.card, textAlign:"center", py:4, color:"#94a3b8" }}>No announcements</Box>
      )}
      {announcements.map(a => (
        <Box key={a.id} sx={S.card}>
          <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <Box>
              <Typography sx={{ fontWeight:700, fontSize:"14px", fontFamily:FONT }}>{a.title}</Typography>
              <Typography sx={{ color:"#64748b", fontSize:"13px", mt:0.4, fontFamily:FONT }}>{a.message}</Typography>
              <Box sx={{ mt:0.8, display:"flex", gap:1, alignItems:"center" }}>
                <Typography sx={{ fontSize:"11px", color:"#94a3b8", fontFamily:FONT }}>
                  {new Date(a.created_at).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric" })}
                </Typography>
                <Chip label={a.target==="all" ? "All Departments" : a.target}/>
              </Box>
            </Box>
            <IconButton onClick={() => toggleAnn(a.id)} size="small">
              {expandedAnn===a.id ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
            </IconButton>
          </Box>

          {expandedAnn===a.id && (
            <Box sx={{ mt:2, pt:2, borderTop:"1px solid #f1f5f9" }}>
              <Typography sx={{ fontWeight:600, fontSize:"13px", fontFamily:FONT, mb:1.2 }}>Replies</Typography>
              {(replies[a.id]||[]).map((r,i) => (
                <Box key={i} sx={{ bgcolor:"#f8fafc", borderRadius:"8px", p:"8px 12px", mb:1 }}>
                  <Typography sx={{ fontSize:"11px", fontWeight:600, color:"#2563eb", fontFamily:FONT }}>{r.user_name}</Typography>
                  <Typography sx={{ fontSize:"13px", fontFamily:FONT, mt:0.3 }}>{r.reply_text}</Typography>
                </Box>
              ))}
              <Box sx={{ display:"flex", gap:1.5, mt:1 }}>
                <input value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  style={{ ...S.inp, marginBottom:0, flex:1 }}/>
                <button onClick={() => submitReply(a.id)}
                  style={{ ...S.btn, width:"auto", padding:"10px 20px" }}>
                  Reply
                </button>
              </Box>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );

  /* ══════════ CHANGE PASSWORD ══════════ */
  const renderChangePassword = () => (
    <Box sx={{ maxWidth:440 }}>
      <Box sx={S.card}>
        <Typography variant="h6" sx={{ fontWeight:700, mb:3, fontFamily:FONT }}>Change Password</Typography>
        {[
          { label:"Current Password", val:cpCur,  set:setCpCur,  ph:"Enter current password" },
          { label:"New Password",     val:cpNew,  set:setCpNew,  ph:"Minimum 4 characters" },
          { label:"Confirm Password", val:cpNew2, set:setCpNew2, ph:"Repeat new password" },
        ].map(f => (
          <Box key={f.label}>
            <Typography sx={{ fontSize:"13px", fontWeight:600, color:"#475569", mb:0.5, fontFamily:FONT }}>{f.label}</Typography>
            <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
              placeholder={f.ph} style={S.inp}/>
          </Box>
        ))}
        {cpMsg && (
          <Box sx={{ p:"10px 14px", borderRadius:"8px", mb:2,
            background: cpMsg.toLowerCase().includes("success") || cpMsg.toLowerCase().includes("changed") ? "#f0fdf4" : "#fef2f2",
            color:       cpMsg.toLowerCase().includes("success") || cpMsg.toLowerCase().includes("changed") ? "#16a34a"  : "#dc2626",
            fontSize:"13px", fontFamily:FONT }}>
            {cpMsg}
          </Box>
        )}
        <button onClick={changePassword} style={S.btn}>Update Password</button>
      </Box>
    </Box>
  );

  const SECTIONS = {
    "Dashboard":       renderDashboard,
    "My Students":     renderStudents,
    "Directory":       renderDirectory,
    "Marks":           renderMarks,
    "Attendance":      renderAttendance,
    "Performance":     renderPerformance,
    "Announcements":   renderAnnouncements,
    "Change Password": renderChangePassword,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html,body,#root{height:auto!important;overflow-y:auto!important;overflow-x:hidden;font-family:'Inter','Segoe UI',sans-serif!important}
        *{font-family:'Inter','Segoe UI',sans-serif}
      `}</style>

      <Box sx={{ display:"flex" }}>
        <CssBaseline/>

        <AppBar position="fixed" open={drawerOpen}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} edge="start"
              sx={{ mr:2, ...(drawerOpen && { display:"none" }) }}>
              <MenuIcon/>
            </IconButton>
            <Typography variant="h6" noWrap sx={{ fontWeight:700, fontFamily:FONT, flexGrow:1 }}>{tab}</Typography>
            {facultyDept && (
              <span style={{ marginRight:8, background:"rgba(255,255,255,0.15)",
                border:"1px solid rgba(255,255,255,0.25)", padding:"3px 12px",
                borderRadius:"999px", fontSize:"12px", fontWeight:600 }}>
                {facultyDept}
              </span>
            )}
            <Typography sx={{ fontSize:"13px", color:"rgba(255,255,255,0.85)", mr:1, fontFamily:FONT }}>{facultyName}</Typography>
          </Toolbar>
        </AppBar>

        <Drawer variant="permanent" open={drawerOpen}>
          <DrawerHeader>
            {drawerOpen && (
              <Box>
                <Typography sx={{ fontWeight:700, color:"#fff", fontSize:"15px", fontFamily:FONT, lineHeight:1.1 }}>SLEA Faculty</Typography>
                {facultyDept && (
                  <Typography sx={{ fontSize:"10px", color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    {facultyDept}
                  </Typography>
                )}
              </Box>
            )}
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color:"#fff" }}>
              {useTheme().direction==="rtl" ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
            </IconButton>
          </DrawerHeader>
          <Divider sx={{ borderColor:"rgba(255,255,255,0.15)" }}/>

          <List sx={{ mt:1, flexGrow:1 }}>
            {MENU.map(({ label, icon }) => {
              const active = tab === label;
              return (
                <ListItem key={label} disablePadding sx={{ display:"block" }}>
                  <MuiTooltip title={!drawerOpen ? label : ""} placement="right">
                    <ListItemButton
                      onClick={() => { setTab(label); if (label!=="My Students") setSelStudent(null); }}
                      sx={{
                        minHeight:48, px:2.5,
                        justifyContent: drawerOpen ? "initial" : "center",
                        mx: drawerOpen ? 1 : 0, my:0.3, borderRadius: drawerOpen ? "10px" : "0",
                        background: active ? "linear-gradient(90deg,#fff,#e0e7ff)" : "transparent",
                        color: active ? "#1e3c72" : "#fff",
                        "&:hover":{ background: active ? "linear-gradient(90deg,#fff,#e0e7ff)" : "rgba(255,255,255,0.15)" },
                        transition:"all 0.2s",
                      }}>
                      <ListItemIcon sx={{ minWidth:0, mr: drawerOpen ? 2 : "auto", justifyContent:"center", color: active ? "#1e3c72" : "#fff" }}>
                        {icon}
                      </ListItemIcon>
                      <ListItemText primary={label} sx={{ opacity: drawerOpen ? 1 : 0 }}
                        primaryTypographyProps={{ fontWeight: active ? 700 : 400, fontSize:"14px", fontFamily:FONT }}/>
                    </ListItemButton>
                  </MuiTooltip>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ borderColor:"rgba(255,255,255,0.15)" }}/>
          <List>
            <ListItem disablePadding sx={{ display:"block" }}>
              <MuiTooltip title={!drawerOpen ? "Logout" : ""} placement="right">
                <ListItemButton onClick={logout} sx={{
                  minHeight:48, px:2.5,
                  justifyContent: drawerOpen ? "initial" : "center",
                  mx: drawerOpen ? 1 : 0, my:0.3, borderRadius: drawerOpen ? "10px" : "0",
                  color:"#fff", "&:hover":{ background:"rgba(239,68,68,0.35)" },
                }}>
                  <ListItemIcon sx={{ minWidth:0, mr: drawerOpen ? 2 : "auto", justifyContent:"center", color:"#fff" }}>
                    <LogoutIcon/>
                  </ListItemIcon>
                  <ListItemText primary="Logout" sx={{ opacity: drawerOpen ? 1 : 0 }}
                    primaryTypographyProps={{ fontSize:"14px", fontFamily:FONT }}/>
                </ListItemButton>
              </MuiTooltip>
            </ListItem>
          </List>
        </Drawer>

        <Box component="main" sx={{ flexGrow:1, bgcolor:"#f4f6f9", minHeight:"100vh", p:4, boxSizing:"border-box" }}>
          <Toolbar/>
          {(SECTIONS[tab] || renderDashboard)()}
        </Box>
      </Box>
    </>
  );
}