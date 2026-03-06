import React, { useState, useEffect, useRef } from "react";
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
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

const GRADE_COLOR = {
  O:"#16a34a","A+":"#2563eb",A:"#0891b2",
  "B+":"#7c3aed",B:"#d97706",C:"#ea580c",F:"#dc2626",
};

const GRADE_REFERENCE = [
  {range:"91–100",grade:"O", pts:10},
  {range:"81–90", grade:"A+",pts:9},
  {range:"71–80", grade:"A", pts:8},
  {range:"61–70", grade:"B+",pts:7},
  {range:"56–60", grade:"B", pts:6},
  {range:"51–55", grade:"C", pts:5},
  {range:"≤50",   grade:"F", pts:0},
];

const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];

const MENU = [
  {label:"Dashboard",    icon:<DashboardIcon/>},
  {label:"Students",     icon:<PeopleIcon/>},
  {label:"Subjects",     icon:<MenuBookIcon/>},
  {label:"Marks",        icon:<GradeIcon/>},
  {label:"Attendance",   icon:<EventAvailableIcon/>},
  {label:"Efficiency",   icon:<EmojiEventsIcon/>},
  {label:"Announcements",icon:<AnnouncementIcon/>},
  {label:"Password",     icon:<LockIcon/>},
];

const getAuth = () => ({Authorization:`Bearer ${localStorage.getItem("token")}`});

const S = {
  inp:{width:"100%",padding:"11px 14px",fontSize:"15px",borderRadius:"8px",
       border:"1px solid #cbd5e1",outline:"none",marginBottom:"14px",
       boxSizing:"border-box",fontFamily:"inherit",background:"#fff"},
  btn:{width:"100%",padding:"12px",background:"linear-gradient(90deg,#1e3c72,#2a5298)",
       color:"#fff",border:"none",borderRadius:"8px",fontSize:"15px",fontWeight:600,cursor:"pointer"},
  card:{background:"#fff",borderRadius:"12px",padding:"24px",
        boxShadow:"0 4px 14px rgba(0,0,0,0.07)"},
  th:{padding:"12px 16px",textAlign:"left",fontSize:"13px"},
  td:{padding:"12px 16px"},
};

const bandColor = b =>
  b==="Excellent"?"#16a34a":b==="Good"?"#2563eb":
  b==="Needs Improvement"?"#d97706":"#dc2626";

/* ─── FIX #4: Roll-no autocomplete dropdown ─── */
function RollInput({value, onChange, onSelect, pool, label="Student Roll Number"}) {
  const [hits, setHits]   = useState([]);
  const [show, setShow]   = useState(false);
  const wrap              = useRef();

  useEffect(() => {
    if (value.trim().length < 2) { setHits([]); setShow(false); return; }
    const q = value.trim().toLowerCase();
    const m = pool.filter(s => s.rollno.toLowerCase().startsWith(q)).slice(0,8);
    setHits(m); setShow(m.length > 0);
  }, [value, pool]);

  useEffect(() => {
    const fn = e => { if (wrap.current && !wrap.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={wrap} style={{position:"relative",marginBottom:"14px"}}>
      <Typography sx={{fontSize:"13px",fontWeight:600,color:"#475569",mb:0.5}}>{label}</Typography>
      <input
        style={{...S.inp, marginBottom:0,
          border: pool.find(s=>s.rollno.toLowerCase()===value.trim().toLowerCase())
            ? "2px solid #16a34a" : "1px solid #cbd5e1"}}
        placeholder="Enter roll number  e.g. 7376232AL1…"
        value={value}
        onChange={e=>onChange(e.target.value)}
        autoComplete="off"
      />
      {show && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:9999,
          background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",
          boxShadow:"0 8px 24px rgba(0,0,0,0.13)",overflow:"hidden"}}>
          {hits.map(s=>(
            <div key={s.id}
              onMouseDown={()=>{onSelect(s);setShow(false);}}
              style={{padding:"10px 16px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",
                display:"flex",justifyContent:"space-between",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <span style={{fontWeight:700,color:"#1e293b"}}>{s.rollno}</span>
              <span style={{fontSize:"12px",color:"#64748b"}}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FoundBanner({student, error}) {
  if (student) return (
    <Box sx={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:"8px",p:"10px 14px",mb:2}}>
      <Typography sx={{fontWeight:700,color:"#16a34a"}}>✅ {student.name}</Typography>
      <Typography sx={{color:"#64748b",fontSize:"13px"}}>Roll: {student.rollno}</Typography>
    </Box>
  );
  if (error) return (
    <Box sx={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:"8px",p:"8px 14px",mb:2}}>
      <Typography sx={{color:"#dc2626",fontSize:"13px"}}>❌ {error}</Typography>
    </Box>
  );
  return null;
}

function MsgBox({msg}) {
  if (!msg) return null;
  const ok = msg.startsWith("✅");
  return <Box sx={{p:"10px 16px",mb:2,borderRadius:"8px",fontWeight:500,
    background:ok?"#dcfce7":"#fee2e2",color:ok?"#16a34a":"#dc2626"}}>{msg}</Box>;
}

/* ═══════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab,     setTab]     = useState("Dashboard");
  const [loading, setLoading] = useState(true);

  /* core data */
  const [students,      setStudents]      = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [marks,         setMarks]         = useState([]);
  const [attendance,    setAttendance]    = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [replies,       setReplies]       = useState({});
  const [allEff,        setAllEff]        = useState([]);   /* FIX #8 */

  /* FIX #5: subject sem tab */
  const [semTab, setSemTab] = useState("Sem 1");

  /* add-student */
  const [sName,  setSName]  = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sRoll,  setSRoll]  = useState("");
  const [sPwd,   setSPwd]   = useState("");

  /* subject form */
  const [subName,    setSubName]    = useState("");
  const [subCred,    setSubCred]    = useState("");
  const [subSem,     setSubSem]     = useState("Sem 1");

  /* marks */
  const [mRoll,    setMRoll]    = useState("");
  const [mStud,    setMStud]    = useState(null);
  const [mErr,     setMErr]     = useState("");
  const [mSubj,    setMSubj]    = useState("");
  const [mScore,   setMScore]   = useState("");
  const [mSem,     setMSem]     = useState("");
  const [mResult,  setMResult]  = useState(null);

  /* attendance — FIX #3: removed subject */
  const [aRoll,    setARoll]    = useState("");
  const [aStud,    setAStud]    = useState(null);
  const [aErr,     setAErr]     = useState("");
  const [aSem,     setASem]     = useState("");
  const [aPres,    setAPres]    = useState("");
  const [aTotal,   setATotal]   = useState("");
  const [aMsg,     setAMsg]     = useState("");

  /* efficiency */
  const [eRoll,    setERoll]    = useState("");
  const [eStud,    setEStud]    = useState(null);
  const [eErr,     setEErr]     = useState("");
  const [eSkill,   setESkill]   = useState("");
  const [eActType, setEActType] = useState("");
  const [eActDesc, setEActDesc] = useState("");
  const [eAchName, setEAchName] = useState("");
  const [eAchPts,  setEAchPts]  = useState("");
  const [eData,    setEData]    = useState(null);
  const [eScore,   setEScore]   = useState(null);
  const [eMsg,     setEMsg]     = useState("");

  /* announcements */
  const [annTitle, setAnnTitle] = useState("");
  const [annMsg,   setAnnMsg]   = useState("");
  const [repTxt,   setRepTxt]   = useState({});
  const [listen,   setListen]   = useState(null);

  /* FIX #6: password */
  const [curPwd,   setCurPwd]   = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [pwdMsg,   setPwdMsg]   = useState("");

  /* ── init ── */
  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    loadAll();
  }, []);

  useEffect(() => {
    if (eStud) { loadEData(eStud.id); loadEScore(eStud.id); }
  }, [eStud]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        doFetch("students",       setStudents),
        doFetch("subjects",       setSubjects),
        doFetch("all-marks",      setMarks),
        doFetch("attendance-list",setAttendance),
        loadAnn(),
        loadAllEff(),
      ]);
    } finally { setLoading(false); }
  };

  const doFetch = async (path, setter) => {
    try {
      const r = await fetch(`http://localhost:5000/${path}`,{headers:getAuth()});
      if (!r.ok) return;
      const d = await r.json();
      setter(Array.isArray(d)?d:[]);
    } catch {}
  };

  const loadAnn = async () => {
    try {
      const r = await fetch("http://localhost:5000/announcements",{headers:getAuth()});
      if (!r.ok) return;
      const list = await r.json();
      setAnnouncements(Array.isArray(list)?list:[]);
      (Array.isArray(list)?list:[]).forEach(a=>loadReplies(a.id));
    } catch {}
  };

  const loadReplies = async id => {
    try {
      const r = await fetch(`http://localhost:5000/announcement/${id}/replies`,{headers:getAuth()});
      const d = await r.json();
      setReplies(p=>({...p,[id]:Array.isArray(d)?d:[]}));
    } catch {}
  };

  /* FIX #8 */
  const loadAllEff = async () => {
    try {
      const r = await fetch("http://localhost:5000/admin/all-efficiency",{headers:getAuth()});
      if (!r.ok) return;
      setAllEff(await r.json());
    } catch {}
  };

  const loadEData = async sid => {
    try {
      const r = await fetch(`http://localhost:5000/admin/student-efficiency-data/${sid}`,{headers:getAuth()});
      if (!r.ok) return;
      setEData(await r.json());
    } catch {}
  };

  const loadEScore = async sid => {
    try {
      const r = await fetch(`http://localhost:5000/efficiency/${sid}`,{headers:getAuth()});
      if (!r.ok) return;
      setEScore(await r.json());
    } catch {}
  };

  /* ── helpers ── */
  const pickStud = (s, setS, setE, setR) => { setS(s); setE(""); setR(s.rollno); };

  const rollChange = (v, setR, setS, setE) => {
    setR(v);
    if (!v.trim()) { setS(null); setE(""); return; }
    const m = students.find(s=>s.rollno.toLowerCase()===v.trim().toLowerCase());
    if (m) { setS(m); setE(""); } else { setS(null); }
  };

  /* ── students ── */
  const addStudent = async () => {
    if (!sName||!sRoll||!sEmail||!sPwd){alert("Fill all fields");return;}
    const r=await fetch("http://localhost:5000/add-student",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({name:sName,rollno:sRoll,email:sEmail,password:sPwd})});
    const d=await r.json(); if(!r.ok){alert(d.message);return;}
    setSName("");setSRoll("");setSEmail("");setSPwd("");
    doFetch("students",setStudents); alert("Student Added");
  };
  const delStudent = async id => {
    if(!window.confirm("Delete this student and all their data?"))return;
    await fetch(`http://localhost:5000/student/${id}`,{method:"DELETE",headers:getAuth()});
    doFetch("students",setStudents); doFetch("all-marks",setMarks); loadAllEff();
  };

  /* ── subjects ── */
  const addSubject = async () => {
    if(!subName||!subCred){alert("Fill subject name and credits");return;}
    const r=await fetch("http://localhost:5000/add-subject",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({subject_name:subName,credits:Number(subCred),semester:subSem})});
    const d=await r.json(); if(!r.ok){alert(d.message);return;}
    setSubName("");setSubCred("");
    doFetch("subjects",setSubjects); alert("Subject Added");
  };
  const delSubject = async id => {
    if(!window.confirm("Delete subject and linked marks?"))return;
    await fetch(`http://localhost:5000/subject/${id}`,{method:"DELETE",headers:getAuth()});
    doFetch("subjects",setSubjects); doFetch("all-marks",setMarks);
  };

  /* ── marks ── */
  const addMark = async () => {
    if(!mStud||!mSubj||!mScore||!mSem){alert("Fill all fields");return;}
    const m=Number(mScore); if(m<0||m>100){alert("Marks 0–100");return;}
    const r=await fetch("http://localhost:5000/add-marks",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:mStud.id,subject_id:mSubj,marks_scored:m,semester:mSem})});
    const d=await r.json(); if(!r.ok){alert(d.message);return;}
    setMResult({...d,semester:mSem});
    setMRoll("");setMStud(null);setMErr("");setMScore("");setMSem("");setMSubj("");
    doFetch("all-marks",setMarks); loadAllEff();
  };
  const delMark = async id => {
    if(!window.confirm("Delete this mark?"))return;
    await fetch(`http://localhost:5000/mark/${id}`,{method:"DELETE",headers:getAuth()});
    doFetch("all-marks",setMarks); loadAllEff();
  };

  /* ── attendance ── */
  const addAtt = async () => {
    if(!aStud||!aSem||!aPres||!aTotal){setAMsg("❌ Fill all fields");return;}
    const p=Number(aPres),t=Number(aTotal);
    if(p>t){setAMsg("❌ Present > Total");return;}
    /* FIX #3: no subject_id, pass null or a placeholder */
    const r=await fetch("http://localhost:5000/add-attendance",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:aStud.id,subject_id:null,semester:aSem,present_days:p,total_days:t})});
    const d=await r.json(); if(!r.ok){setAMsg(`❌ ${d.message}`);return;}
    setAMsg(`✅ Saved — Efficiency: ${((p/t)*100).toFixed(1)}%`);
    setARoll("");setAStud(null);setASem("");setAPres("");setATotal("");
    doFetch("attendance-list",setAttendance);
  };

  /* ── efficiency ── */
  const setSkill = async () => {
    if(!eStud||!eSkill){setEMsg("❌ Select student and skill");return;}
    const r=await fetch("http://localhost:5000/admin/student-skill",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,skill_level:eSkill})});
    const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg(`✅ Skill → ${eSkill} (${d.skill_score} pts)`);
    loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const addAct = async () => {
    if(!eStud||!eActType){setEMsg("❌ Select student and activity");return;}
    const r=await fetch("http://localhost:5000/admin/student-activity",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,activity_type:eActType,description:eActDesc})});
    const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg(`✅ ${d.message}`); setEActType(""); setEActDesc("");
    loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const delAct = async id => {
    await fetch(`http://localhost:5000/admin/student-activity/${id}`,{method:"DELETE",headers:getAuth()});
    loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const addAch = async () => {
    if(!eStud||!eAchName||!eAchPts){setEMsg("❌ Fill all achievement fields");return;}
    const r=await fetch("http://localhost:5000/admin/student-achievement",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,achievement_name:eAchName,points:Number(eAchPts)})});
    const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg("✅ Achievement added"); setEAchName(""); setEAchPts("");
    loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const delAch = async id => {
    await fetch(`http://localhost:5000/admin/student-achievement/${id}`,{method:"DELETE",headers:getAuth()});
    loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };

  /* ── announcements ── */
  const postAnn = async () => {
    if(!annTitle||!annMsg){alert("Title and message required");return;}
    await fetch("http://localhost:5000/admin/announcement",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({title:annTitle,message:annMsg})});
    setAnnTitle(""); setAnnMsg(""); loadAnn();
  };
  /* FIX #2: admin delete announcement */
  const delAnn = async id => {
    if(!window.confirm("Delete this announcement?"))return;
    await fetch(`http://localhost:5000/superadmin/announcement/${id}`,{method:"DELETE",headers:getAuth()});
    loadAnn();
  };
  const startVoice = annId => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Use Chrome for voice");return;}
    const rec=new SR(); rec.lang="en-IN"; rec.interimResults=false;
    setListen(annId);
    rec.onresult=e=>{setRepTxt(p=>({...p,[annId]:e.results[0][0].transcript}));setListen(null);};
    rec.onerror=()=>setListen(null); rec.onend=()=>setListen(null); rec.start();
  };
  const sendReply = async (annId,isVoice=false) => {
    const t=(repTxt[annId]||"").trim(); if(!t)return;
    await fetch(`http://localhost:5000/announcement/${annId}/reply`,{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({reply_text:t,is_voice:isVoice})});
    setRepTxt(p=>({...p,[annId]:""})); loadReplies(annId);
  };

  /* FIX #6: change password */
  const changePassword = async () => {
    if(!curPwd||!newPwd){setPwdMsg("❌ Fill both fields");return;}
    const r=await fetch("http://localhost:5000/change-password",{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({current_password:curPwd,new_password:newPwd})});
    const d=await r.json(); if(!r.ok){setPwdMsg(`❌ ${d.message}`);return;}
    setPwdMsg("✅ Password changed!"); setCurPwd(""); setNewPwd("");
  };

  const logout = () => { localStorage.clear(); navigate("/"); };

  /* ── computed ── */
  /* FIX #3: live attendance efficiency */
  const attEff = aPres && aTotal && Number(aTotal)>0
    ? ((Number(aPres)/Number(aTotal))*100).toFixed(1) : null;

  /* FIX #5: subjects by selected sem */
  const subsBySem = subjects.filter(s=>(s.semester||"Sem 1")===semTab);

  /* FIX #8: avg efficiency */
  const avgEff = allEff.length>0
    ? (allEff.reduce((s,e)=>s+e.finalScore,0)/allEff.length).toFixed(1) : "—";

  if (loading) return <Typography sx={{p:4}}>Loading…</Typography>;

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`html,body,#root{height:auto!important;overflow-y:auto!important;overflow-x:hidden}`}</style>
      <Box sx={{display:"flex",alignItems:"flex-start"}}>
        <CssBaseline/>

        {/* AppBar */}
        <AppBar position="fixed" sx={{width:`calc(100% - ${drawerWidth}px)`,ml:`${drawerWidth}px`,background:"linear-gradient(90deg,#1e3c72,#2a5298)"}}>
          <Toolbar><Typography variant="h6" noWrap sx={{fontWeight:700}}>{tab}</Typography></Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer variant="permanent" anchor="left" sx={{width:drawerWidth,flexShrink:0,
          "& .MuiDrawer-paper":{width:drawerWidth,boxSizing:"border-box",
            background:"linear-gradient(180deg,#1e3c72,#2a5298)",color:"#fff",
            display:"flex",flexDirection:"column"}}}>
          <Toolbar sx={{justifyContent:"center"}}>
            <Typography variant="h6" sx={{fontWeight:700,color:"#fff"}}>SLEA Admin</Typography>
          </Toolbar>
          <Divider sx={{borderColor:"rgba(255,255,255,0.15)"}}/>
          <List sx={{mt:1,flexGrow:1}}>
            {MENU.map(({label,icon})=>(
              <ListItem key={label} disablePadding>
                <ListItemButton onClick={()=>setTab(label)} sx={{mx:1.5,my:0.5,borderRadius:"10px",
                  background:tab===label?"linear-gradient(90deg,#fff,#e0e7ff)":"transparent",
                  color:tab===label?"#1e3c72":"#fff",
                  "&:hover":{background:"rgba(255,255,255,0.15)",color:"#fff"},transition:"all 0.2s"}}>
                  <ListItemIcon sx={{color:tab===label?"#1e3c72":"#fff",minWidth:40}}>{icon}</ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{fontWeight:tab===label?700:400,fontSize:"15px"}}/>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{borderColor:"rgba(255,255,255,0.15)"}}/>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={logout} sx={{mx:1.5,my:0.5,borderRadius:"10px",color:"#fff","&:hover":{background:"rgba(239,68,68,0.35)"}}}>
                <ListItemIcon sx={{color:"#fff",minWidth:40}}><LogoutIcon/></ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{fontSize:"15px"}}/>
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* Main */}
        <Box component="main" sx={{flexGrow:1,bgcolor:"#f4f6f9",minHeight:"100vh",p:4,boxSizing:"border-box"}}>
          <Toolbar/>

          {/* ══════════════════ DASHBOARD */}
          {tab==="Dashboard" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Admin Overview</Typography>

              {/* Stat cards */}
              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",mb:4}}>
                {[
                  {label:"Total Students",    value:students.length,  color:"#2563eb"},
                  {label:"Total Subjects",     value:subjects.length,  color:"#16a34a"},
                  {label:"Marks Entries",      value:marks.length,     color:"#d97706"},
                  {label:"Avg Efficiency",     value:avgEff,           color:"#7c3aed"},
                ].map(({label,value,color})=>(
                  <Box key={label} sx={{flex:"1 1 160px",...S.card,textAlign:"center",borderTop:`4px solid ${color}`}}>
                    <Typography sx={{fontSize:"14px",color:"#64748b",mb:1}}>{label}</Typography>
                    <Typography sx={{fontSize:"32px",fontWeight:700,color}}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* FIX #8: Student efficiency table */}
              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
                <Typography variant="h6" sx={{fontWeight:700}}>Student Efficiency Overview</Typography>
                {allEff.length>0 && (
                  <Box sx={{background:"#7c3aed20",border:"1px solid #7c3aed",borderRadius:"10px",px:3,py:1,textAlign:"center"}}>
                    <Typography sx={{fontSize:"11px",color:"#7c3aed",fontWeight:600}}>CLASS AVERAGE</Typography>
                    <Typography sx={{fontSize:"24px",fontWeight:800,color:"#7c3aed"}}>{avgEff}</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:"900px"}}>
                  <thead>
                    <tr style={{background:"linear-gradient(90deg,#1e293b,#0f172a)",color:"#fff"}}>
                      {["#","Student","Roll No","CGPA (/10)","Score /100","Band","Dept Rank","Overall Rank","Better than (Dept)","Better than (All)"].map(h=>(
                        <th key={h} style={{...S.th,whiteSpace:"nowrap",borderBottom:"2px solid #334155",fontSize:"12px"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allEff.map((e,i)=>{
                      const bc = bandColor(e.band);
                      const pctColor = p => p>=75?"#16a34a":p>=50?"#2563eb":"#dc2626";
                      const pctIcon  = p => p>=90?"🏆":p>=50?"📈":"📉";
                      const PctRow = ({label,val}) => (
                        <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"2px"}}>
                          <span style={{fontSize:"10px",color:"#94a3b8",width:"44px",flexShrink:0}}>{label}</span>
                          <span style={{fontSize:"11px"}}>{pctIcon(val??0)}</span>
                          <span style={{fontSize:"11px",fontWeight:700,color:pctColor(val??0)}}>{val??0}%</span>
                        </div>
                      );
                      return (
                        <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}
                          onMouseEnter={ev=>ev.currentTarget.style.background="#f8fafc"}
                          onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                          <td style={{...S.td,color:"#94a3b8",fontWeight:600}}>{i+1}</td>
                          <td style={{...S.td,fontWeight:600}}>{e.name}</td>
                          <td style={{...S.td,fontFamily:"monospace",fontSize:"13px",color:"#475569"}}>{e.rollno}</td>
                          {/* CGPA out of 10 */}
                          <td style={{...S.td}}>
                            <span style={{fontWeight:700,fontSize:"16px",color:"#0891b2"}}>{e.cgpa}</span>
                            <span style={{fontSize:"10px",color:"#94a3b8"}}> /10</span>
                          </td>
                          {/* Score with mini bar */}
                          <td style={S.td}>
                            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                              <div style={{width:"48px",height:"6px",background:"#f1f5f9",borderRadius:"3px",overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${e.finalScore}%`,background:bc,borderRadius:"3px"}}/>
                              </div>
                              <span style={{fontWeight:800,fontSize:"15px",color:bc}}>{e.finalScore}</span>
                            </div>
                          </td>
                          {/* Band */}
                          <td style={S.td}>
                            <span style={{padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700,
                              background:bc+"20",color:bc,border:`1px solid ${bc}44`,whiteSpace:"nowrap"}}>
                              {e.band}
                            </span>
                          </td>
                          {/* Dept Rank */}
                          <td style={{...S.td,textAlign:"center"}}>
                            <span style={{fontWeight:800,fontSize:"17px",color:"#7c3aed"}}>#{e.deptRank??'—'}</span>
                            <span style={{fontSize:"11px",color:"#94a3b8"}}>/{e.deptTotal??'—'}</span>
                          </td>
                          {/* Overall Rank */}
                          <td style={{...S.td,textAlign:"center"}}>
                            <span style={{fontWeight:800,fontSize:"17px",color:"#2563eb"}}>#{e.overallRank??'—'}</span>
                            <span style={{fontSize:"11px",color:"#94a3b8"}}>/{e.overallTotal??'—'}</span>
                          </td>
                          {/* Better than Dept */}
                          <td style={S.td}>
                            <PctRow label="Skills"   val={e.deptPercentile?.skill}/>
                            <PctRow label="Ach"      val={e.deptPercentile?.achievement}/>
                            <PctRow label="Activity" val={e.deptPercentile?.activity}/>
                            <PctRow label="CGPA"     val={e.deptPercentile?.cgpa}/>
                          </td>
                          {/* Better than All */}
                          <td style={S.td}>
                            <PctRow label="Skills"   val={e.allPercentile?.skill}/>
                            <PctRow label="Ach"      val={e.allPercentile?.achievement}/>
                            <PctRow label="Activity" val={e.allPercentile?.activity}/>
                            <PctRow label="CGPA"     val={e.allPercentile?.cgpa}/>
                          </td>
                        </tr>
                      );
                    })}
                    {allEff.length===0&&(
                      <tr><td colSpan={10} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"28px"}}>
                        No efficiency data yet — add skills/activities in the Efficiency tab.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ══════════════════ STUDENTS */}
          {tab==="Students" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Add Student</Typography>
              <Box sx={{...S.card,maxWidth:480,mb:4}}>
                <input style={S.inp} placeholder="Name"        value={sName}  onChange={e=>setSName(e.target.value)}/>
                <input style={S.inp} placeholder="Email"       value={sEmail} onChange={e=>setSEmail(e.target.value)}/>
                <input style={S.inp} placeholder="Roll Number" value={sRoll}  onChange={e=>setSRoll(e.target.value)}/>
                <input style={S.inp} type="password" placeholder="Password" value={sPwd} onChange={e=>setSPwd(e.target.value)}/>
                <button style={S.btn} onClick={addStudent}>Add Student</button>
              </Box>
              <Typography variant="h6" sx={{fontWeight:700,mb:2}}>All Students ({students.length})</Typography>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    {["#","Name","Roll No","Email","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {students.map((s,i)=>(
                      <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                        <td style={{...S.td,fontWeight:500}}>{s.name}</td>
                        <td style={{...S.td,fontFamily:"monospace"}}>{s.rollno}</td>
                        <td style={{...S.td,color:"#475569"}}>{s.email}</td>
                        <td style={S.td}><IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delStudent(s.id)}><DeleteIcon fontSize="small"/></IconButton></td>
                      </tr>
                    ))}
                    {students.length===0&&<tr><td colSpan={5} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"20px"}}>No students yet</td></tr>}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ══════════════════ SUBJECTS — FIX #5: sem tabs */}
          {tab==="Subjects" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Subjects</Typography>
              <Box sx={{...S.card,maxWidth:480,mb:4}}>
                <input style={S.inp} placeholder="Subject Name" value={subName} onChange={e=>setSubName(e.target.value)}/>
                <input style={S.inp} type="number" placeholder="Credits (1–5)" value={subCred} onChange={e=>setSubCred(e.target.value)}/>
                <select style={S.inp} value={subSem} onChange={e=>setSubSem(e.target.value)}>
                  {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button style={S.btn} onClick={addSubject}>Add Subject</button>
              </Box>

              {/* FIX #5: Semester tab pills */}
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
                {SEMESTERS.map(sem=>{
                  const cnt=subjects.filter(s=>(s.semester||"Sem 1")===sem).length;
                  return (
                    <button key={sem} onClick={()=>setSemTab(sem)} style={{
                      padding:"8px 18px",borderRadius:"20px",border:"none",cursor:"pointer",
                      fontWeight:600,fontSize:"13px",transition:"all 0.2s",
                      background:semTab===sem?"linear-gradient(90deg,#1e3c72,#2a5298)":"#fff",
                      color:semTab===sem?"#fff":"#475569",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                    }}>
                      {sem} <span style={{opacity:0.75,fontSize:"11px"}}>({cnt})</span>
                    </button>
                  );
                })}
              </div>

              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    {["#","Subject","Semester","Credits","Department","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {subsBySem.map((s,i)=>(
                      <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                        <td style={{...S.td,fontWeight:500}}>{s.subject_name}</td>
                        <td style={S.td}><span style={{background:"#f1f5f9",padding:"2px 8px",borderRadius:"20px",fontSize:"12px"}}>{s.semester||"Sem 1"}</span></td>
                        <td style={S.td}>{s.credits} cr</td>
                        <td style={S.td}><span style={{background:"#2563eb",color:"#fff",padding:"2px 10px",borderRadius:"20px",fontSize:"12px"}}>{s.department}</span></td>
                        <td style={S.td}><IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delSubject(s.id)}><DeleteIcon fontSize="small"/></IconButton></td>
                      </tr>
                    ))}
                    {subsBySem.length===0&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"20px"}}>No subjects for {semTab}</td></tr>}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ══════════════════ MARKS */}
          {tab==="Marks" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Add Marks</Typography>

              {/* Grade reference */}
              <Box sx={{...S.card,mb:3}}>
                <Typography sx={{fontWeight:600,mb:1.5,color:"#475569",fontSize:"14px"}}>📊 Grade Reference</Typography>
                <Box sx={{display:"flex",gap:1,flexWrap:"wrap"}}>
                  {GRADE_REFERENCE.map(({range,grade,pts})=>(
                    <Box key={grade} sx={{background:GRADE_COLOR[grade]+"18",border:`1px solid ${GRADE_COLOR[grade]}`,borderRadius:"8px",p:"6px 12px",textAlign:"center",minWidth:"76px"}}>
                      <Typography sx={{fontWeight:700,color:GRADE_COLOR[grade],fontSize:"15px"}}>{grade}</Typography>
                      <Typography sx={{fontSize:"11px",color:"#64748b"}}>{range}</Typography>
                      <Typography sx={{fontSize:"11px",color:"#64748b"}}>{pts} pts</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Form — FIX #4: autocomplete */}
              <Box sx={{...S.card,maxWidth:500,mb:3}}>
                <RollInput value={mRoll}
                  onChange={v=>rollChange(v,setMRoll,setMStud,setMErr)}
                  onSelect={s=>pickStud(s,setMStud,setMErr,setMRoll)}
                  pool={students}/>
                <FoundBanner student={mStud} error={mErr}/>
                <select style={S.inp} value={mSubj} onChange={e=>setMSubj(e.target.value)}>
                  <option value="">Select Subject</option>
                  {subjects.map(s=><option key={s.id} value={s.id}>{s.subject_name} ({s.semester||"Sem 1"}) — {s.credits} cr</option>)}
                </select>
                <select style={S.inp} value={mSem} onChange={e=>setMSem(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <input style={S.inp} type="number" placeholder="Marks Scored (0–100)" value={mScore} onChange={e=>setMScore(e.target.value)}/>
                <button style={{...S.btn,opacity:mStud?1:0.5}} onClick={addMark} disabled={!mStud}>Add Marks</button>
              </Box>

              {mResult && (
                <Box sx={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:"12px",p:3,mb:3}}>
                  <Typography sx={{fontWeight:700,color:"#16a34a",mb:1.5}}>✅ Marks Added!</Typography>
                  <Box sx={{display:"flex",gap:2,flexWrap:"wrap"}}>
                    {[{l:"Grade",v:mResult.grade,c:GRADE_COLOR[mResult.grade]||"#16a34a"},{l:"Grade Pts",v:mResult.gradePoints,c:"#2563eb"},{l:"Credits",v:mResult.credits,c:"#7c3aed"},{l:"SGPA",v:mResult.sgpa,c:"#d97706"}].map(({l,v,c})=>(
                      <Box key={l} sx={{background:"#fff",borderRadius:"8px",p:"10px 18px",textAlign:"center",border:`2px solid ${c}`}}>
                        <Typography sx={{fontSize:"22px",fontWeight:700,color:c}}>{v}</Typography>
                        <Typography sx={{fontSize:"12px",color:"#64748b"}}>{l}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <button onClick={()=>setMResult(null)} style={{marginTop:"10px",padding:"6px 16px",background:"#ef4444",color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer"}}>Dismiss</button>
                </Box>
              )}

              <Typography variant="h6" sx={{fontWeight:700,mb:2}}>All Marks ({marks.length})</Typography>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    {["#","Student","Subject","Sem","Marks","Grade","Pts","Credits","Del"].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {marks.map((m,i)=>(
                      <tr key={m.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                        <td style={{...S.td,fontWeight:500}}>{m.student_name}</td>
                        <td style={S.td}>{m.subject_name}</td>
                        <td style={S.td}>{m.semester}</td>
                        <td style={S.td}>{m.marks_scored}</td>
                        <td style={S.td}><span style={{background:(GRADE_COLOR[m.grade]||"#64748b")+"20",color:GRADE_COLOR[m.grade]||"#64748b",padding:"2px 10px",borderRadius:"20px",fontWeight:700}}>{m.grade}</span></td>
                        <td style={S.td}>{m.grade_points}</td>
                        <td style={S.td}>{m.credits}</td>
                        <td style={S.td}><IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delMark(m.id)}><DeleteIcon fontSize="small"/></IconButton></td>
                      </tr>
                    ))}
                    {marks.length===0&&<tr><td colSpan={9} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"24px"}}>No marks yet</td></tr>}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ══════════════════ ATTENDANCE — FIX #3 */}
          {tab==="Attendance" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Attendance</Typography>
              <MsgBox msg={aMsg}/>
              <Box sx={{...S.card,maxWidth:500,mb:4}}>
                {/* FIX #4: autocomplete */}
                <RollInput value={aRoll}
                  onChange={v=>rollChange(v,setARoll,setAStud,setAErr)}
                  onSelect={s=>pickStud(s,setAStud,setAErr,setARoll)}
                  pool={students}/>
                <FoundBanner student={aStud} error={aErr}/>

                {/* FIX #3: NO subject field */}
                <select style={S.inp} value={aSem} onChange={e=>setASem(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{display:"flex",gap:"12px"}}>
                  <input style={{...S.inp,flex:1}} type="number" min="0" placeholder="Completed Days" value={aPres} onChange={e=>setAPres(e.target.value)}/>
                  <input style={{...S.inp,flex:1}} type="number" min="1" placeholder="Total Planned Days" value={aTotal} onChange={e=>setATotal(e.target.value)}/>
                </div>

                {/* FIX #3: Live efficiency score preview */}
                {attEff !== null && (
                  <Box sx={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"10px",p:2,mb:2,textAlign:"center"}}>
                    <Typography sx={{fontSize:"12px",color:"#64748b",mb:0.5}}>
                      Attendance Efficiency = ({aPres} / {aTotal}) × 100
                    </Typography>
                    <Typography sx={{fontSize:"36px",fontWeight:800,
                      color:parseFloat(attEff)>=75?"#16a34a":"#dc2626"}}>
                      {attEff}%
                    </Typography>
                    <Typography sx={{fontSize:"12px",fontWeight:600,
                      color:parseFloat(attEff)>=75?"#16a34a":"#dc2626"}}>
                      {parseFloat(attEff)>=75?"✓ Eligible for Exam":"⚠ Below 75% — Shortage"}
                    </Typography>
                  </Box>
                )}
                <button style={{...S.btn,opacity:aStud?1:0.5}} onClick={addAtt} disabled={!aStud}>Save Attendance</button>
              </Box>

              <Typography variant="h6" sx={{fontWeight:700,mb:2}}>Records ({attendance.length})</Typography>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    {["#","Student","Semester","Completed Days","Total Days","Efficiency %"].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {attendance.map((a,i)=>{
                      const pct=a.present_days!=null&&a.total_days>0
                        ?((a.present_days/a.total_days)*100).toFixed(1)
                        :Number(a.attendance_percentage||0).toFixed(1);
                      return (
                        <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                          <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                          <td style={{...S.td,fontWeight:500}}>{a.student_name||"—"}</td>
                          <td style={S.td}>{a.semester}</td>
                          <td style={S.td}>{a.present_days??"-"}</td>
                          <td style={S.td}>{a.total_days??"-"}</td>
                          <td style={S.td}><span style={{fontWeight:700,color:parseFloat(pct)>=75?"#16a34a":"#dc2626"}}>{pct}%</span></td>
                        </tr>
                      );
                    })}
                    {attendance.length===0&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"24px"}}>No records yet</td></tr>}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* ══════════════════ EFFICIENCY */}
          {tab==="Efficiency" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:1}}>Student Efficiency Data</Typography>
              <Typography sx={{color:"#64748b",mb:3,fontSize:"13px",lineHeight:1.7}}>
                Score = (Skills/MaxSkills × 0.30) + (Achievements/MaxAch × 0.20) + (Activities/MaxAct × 0.20) + (CGPA/10 × 0.30) × 100
              </Typography>
              <MsgBox msg={eMsg}/>

              <Box sx={{...S.card,maxWidth:480,mb:3}}>
                {/* FIX #4: autocomplete */}
                <RollInput value={eRoll}
                  onChange={v=>{setERoll(v);setEData(null);setEScore(null);rollChange(v,setERoll,setEStud,setEErr);}}
                  onSelect={s=>{setEStud(s);setERoll(s.rollno);setEErr("");setEData(null);setEScore(null);}}
                  pool={students}/>
                <FoundBanner student={eStud} error={eErr}/>
              </Box>

              {eStud && (
                <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start"}}>
                  <Box sx={{flex:"1 1 320px"}}>

                    {/* Skill — show history list like Achievements */}
                    <Box sx={{...S.card,mb:3}}>
                      <Typography sx={{fontWeight:700,fontSize:"15px",mb:2}}>🎯 Skill Level</Typography>
                      <select style={S.inp} value={eSkill} onChange={e=>setESkill(e.target.value)}>
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner (25 pts)</option>
                        <option value="Intermediate">Intermediate (50 pts)</option>
                        <option value="Advanced">Advanced (75 pts)</option>
                        <option value="Expert">Expert (100 pts)</option>
                      </select>
                      <button style={S.btn} onClick={setSkill}>Save Skill</button>
                      {/* Show current skill as a deletable item like achievements */}
                      {eData?.skill && (
                        <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",
                          background:"#f8fafc",borderRadius:"8px",p:"8px 12px",mt:1.5,
                          border:"1px solid #e2e8f0"}}>
                          <Box>
                            <Typography sx={{fontSize:"13px",fontWeight:600,color:"#1e293b"}}>
                              {eData.skill.skill_level}
                            </Typography>
                            <Typography sx={{fontSize:"11px",color:"#64748b"}}>
                              Current skill level
                            </Typography>
                          </Box>
                          <span style={{background:"#ede9fe",color:"#7c3aed",padding:"3px 12px",
                            borderRadius:"999px",fontSize:"13px",fontWeight:700}}>
                            {eData.skill.skill_score} pts
                          </span>
                        </Box>
                      )}
                      {!eData?.skill && (
                        <Box sx={{background:"#fef9f0",border:"1px solid #fed7aa",borderRadius:"8px",
                          p:"8px 14px",mt:1.5,fontSize:"13px",color:"#92400e"}}>
                          No skill level set yet
                        </Box>
                      )}
                    </Box>

                    {/* Activity */}
                    <Box sx={{...S.card,mb:3}}>
                      <Typography sx={{fontWeight:700,fontSize:"15px",mb:2}}>🏃 Add Activity</Typography>
                      <select style={S.inp} value={eActType} onChange={e=>setEActType(e.target.value)}>
                        <option value="">Select Activity</option>
                        {["Club (10)","Workshop (15)","NSS (20)","NCC (25)","Sports (15)","Leadership (20)","Volunteering (15)"].map(x=>{
                          const t=x.split(" (")[0];
                          return <option key={t} value={t}>{x} pts</option>;
                        })}
                      </select>
                      <input style={S.inp} placeholder="Description (optional)" value={eActDesc} onChange={e=>setEActDesc(e.target.value)}/>
                      <button style={S.btn} onClick={addAct}>Add Activity</button>
                      {(eData?.activities||[]).map(a=>(
                        <Box key={a.id} sx={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8fafc",borderRadius:"8px",p:"8px 12px",mt:1}}>
                          <Box>
                            <Typography sx={{fontSize:"13px",fontWeight:500}}>{a.activity_type}</Typography>
                            {a.description&&<Typography sx={{fontSize:"11px",color:"#64748b"}}>{a.description}</Typography>}
                          </Box>
                          <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                            <span style={{background:"#dbeafe",color:"#2563eb",padding:"2px 8px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{a.points} pts</span>
                            <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAct(a.id)}><DeleteIcon fontSize="small"/></IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Achievement */}
                    <Box sx={{...S.card,mb:3}}>
                      <Typography sx={{fontWeight:700,fontSize:"15px",mb:2}}>🏆 Add Achievement</Typography>
                      <input style={S.inp} placeholder="Achievement Name" value={eAchName} onChange={e=>setEAchName(e.target.value)}/>
                      <input style={S.inp} type="number" placeholder="Points (e.g. 20)" value={eAchPts} onChange={e=>setEAchPts(e.target.value)}/>
                      <button style={S.btn} onClick={addAch}>Add Achievement</button>
                      {(eData?.achievements||[]).map(a=>(
                        <Box key={a.id} sx={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f8fafc",borderRadius:"8px",p:"8px 12px",mt:1}}>
                          <Typography sx={{fontSize:"13px",fontWeight:500}}>{a.achievement_name}</Typography>
                          <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                            <span style={{background:"#fef3c7",color:"#d97706",padding:"2px 8px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{a.points} pts</span>
                            <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAch(a.id)}><DeleteIcon fontSize="small"/></IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Score card */}
                  {eScore && (
                    <Box sx={{flex:"0 0 300px"}}>
                      <Box sx={{...S.card,border:`3px solid ${bandColor(eScore.band)}`,position:"sticky",top:"80px"}}>
                        <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,textAlign:"center"}}>📊 Efficiency Score</Typography>
                        <Box sx={{textAlign:"center",mb:3}}>
                          <Typography sx={{fontSize:"60px",fontWeight:800,color:bandColor(eScore.band),lineHeight:1}}>{eScore.finalScore}</Typography>
                          <span style={{display:"inline-block",marginTop:"8px",padding:"4px 18px",borderRadius:"999px",fontWeight:700,fontSize:"14px",
                            background:bandColor(eScore.band)+"22",color:bandColor(eScore.band),border:`1px solid ${bandColor(eScore.band)}`}}>
                            {eScore.band}
                          </span>
                        </Box>
                        {[
                          {l:"Skills (30%)",      v:eScore.skillScore,       c:"#7c3aed"},
                          {l:"Achievements (20%)",v:eScore.achievementScore, c:"#d97706"},
                          {l:"Activities (20%)",  v:eScore.activityScore,    c:"#16a34a"},
                          {l:"CGPA (30%)",         v:eScore.cgpaScore,        c:"#2563eb"},
                        ].map(({l,v,c})=>(
                          <Box key={l} sx={{mb:1.5}}>
                            <Box sx={{display:"flex",justifyContent:"space-between",mb:0.5}}>
                              <Typography sx={{fontSize:"12px",color:"#64748b"}}>{l}</Typography>
                              <Typography sx={{fontSize:"12px",fontWeight:600,color:c}}>{v}/100</Typography>
                            </Box>
                            <Box sx={{height:"6px",background:"#f1f5f9",borderRadius:"3px",overflow:"hidden"}}>
                              <Box sx={{height:"100%",width:`${v}%`,background:c,borderRadius:"3px",transition:"width 0.8s ease"}}/>
                            </Box>
                          </Box>
                        ))}
                        <Box sx={{mt:2,pt:2,borderTop:"1px solid #f1f5f9",textAlign:"center"}}>
                          <Typography sx={{fontSize:"12px",color:"#64748b"}}>CGPA: <strong>{eScore.cgpa}</strong></Typography>
                          <Typography sx={{fontSize:"11px",color:"#94a3b8",mt:0.3}}>All peer-normalised</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* ══════════════════ ANNOUNCEMENTS — FIX #2: delete */}
          {tab==="Announcements" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Announcements</Typography>
              <Box sx={{...S.card,maxWidth:520,mb:4}}>
                <Typography sx={{fontWeight:600,mb:1.5,color:"#475569",fontSize:"14px"}}>📢 Post to your department</Typography>
                <input style={S.inp} placeholder="Title" value={annTitle} onChange={e=>setAnnTitle(e.target.value)}/>
                <textarea style={{...S.inp,height:"80px",resize:"vertical",marginBottom:"14px"}} placeholder="Message…" value={annMsg} onChange={e=>setAnnMsg(e.target.value)}/>
                <button style={S.btn} onClick={postAnn}>Post Announcement</button>
              </Box>
              <Typography variant="h6" sx={{fontWeight:700,mb:2}}>All Announcements ({announcements.length})</Typography>
              {announcements.length===0
                ? <Typography sx={{color:"#94a3b8"}}>No announcements yet.</Typography>
                : announcements.map(ann=>(
                  <Box key={ann.id} sx={{...S.card,mb:2,borderLeft:"4px solid #2563eb",p:"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
                      <span style={{fontSize:"11px",padding:"2px 10px",borderRadius:"999px",background:"#fee2e2",color:"#dc2626",border:"1px solid #fca5a5",fontWeight:600}}>
                        {ann.target==="all"?"Super Admin → All":ann.target+" Dept"}
                      </span>
                      <span style={{fontSize:"11px",color:"#94a3b8",marginLeft:"auto"}}>{ann.created_at?new Date(ann.created_at).toLocaleString():""}</span>
                      {/* FIX #2 */}
                      <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAnn(ann.id)}><DeleteIcon fontSize="small"/></IconButton>
                    </div>
                    <Typography sx={{fontWeight:700,fontSize:"16px",mb:0.5}}>{ann.title}</Typography>
                    <Typography sx={{color:"#475569",fontSize:"14px",mb:1.5}}>{ann.message}</Typography>
                    {(replies[ann.id]||[]).length>0&&(
                      <Box sx={{mb:1.5,pl:1.5,borderLeft:"2px solid #e2e8f0"}}>
                        {(replies[ann.id]||[]).map((r,i)=>(
                          <Box key={i} sx={{background:"#f8fafc",borderRadius:"8px",p:"8px 12px",mb:0.8}}>
                            <Typography sx={{fontSize:"12px",color:"#2563eb",fontWeight:600}}>{r.user_name||"User"}{r.is_voice===1&&<span style={{color:"#7c3aed",marginLeft:"6px",fontSize:"10px"}}>🎤</span>}</Typography>
                            <Typography sx={{fontSize:"13px",color:"#475569"}}>{r.reply_text}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                      <input style={{flex:1,padding:"9px 14px",fontSize:"13px",border:"1px solid #e2e8f0",borderRadius:"8px",outline:"none",fontFamily:"inherit"}}
                        placeholder="Reply…" value={repTxt[ann.id]||""}
                        onChange={e=>setRepTxt(p=>({...p,[ann.id]:e.target.value}))}
                        onKeyDown={e=>e.key==="Enter"&&sendReply(ann.id)}/>
                      <button onClick={()=>startVoice(ann.id)} style={{padding:"9px 11px",border:"1px solid #e2e8f0",borderRadius:"8px",cursor:"pointer",fontSize:"15px",background:listen===ann.id?"#fee2e2":"#f8fafc"}}>🎤</button>
                      <button onClick={()=>sendReply(ann.id)} style={{padding:"9px 18px",background:"#2563eb",color:"#fff",border:"none",borderRadius:"8px",fontWeight:600,fontSize:"13px",cursor:"pointer"}}>Reply</button>
                    </div>
                    {listen===ann.id&&<Typography sx={{color:"#ef4444",fontSize:"12px",mt:0.5}}>🎤 Listening…</Typography>}
                  </Box>
                ))
              }
            </Box>
          )}

          {/* ══════════════════ CHANGE PASSWORD — FIX #6 */}
          {tab==="Password" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Change Password</Typography>
              <Box sx={{...S.card,maxWidth:420}}>
                <MsgBox msg={pwdMsg}/>
                <input style={S.inp} type="password" placeholder="Current Password" value={curPwd} onChange={e=>{setCurPwd(e.target.value);setPwdMsg("");}}/>
                <input style={S.inp} type="password" placeholder="New Password (min 4 chars)" value={newPwd} onChange={e=>{setNewPwd(e.target.value);setPwdMsg("");}}/>
                <button style={S.btn} onClick={changePassword}>Update Password</button>
              </Box>
            </Box>
          )}

        </Box>
      </Box>
    </>
  );
}