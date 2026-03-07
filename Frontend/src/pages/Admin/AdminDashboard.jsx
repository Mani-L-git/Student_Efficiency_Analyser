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
import EditIcon from "@mui/icons-material/Edit";
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

const FONT = "'Inter','Segoe UI','Helvetica Neue',sans-serif";

const S = {
  inp:{width:"100%",padding:"11px 14px",fontSize:"14px",borderRadius:"8px",
       border:"1px solid #cbd5e1",outline:"none",marginBottom:"14px",
       boxSizing:"border-box",fontFamily:FONT,background:"#fff",color:"#0f172a"},
  btn:{width:"100%",padding:"12px",background:"linear-gradient(90deg,#1e3c72,#2a5298)",
       color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:600,
       cursor:"pointer",fontFamily:FONT,letterSpacing:"0.3px"},
  card:{background:"#fff",borderRadius:"12px",padding:"24px",
        boxShadow:"0 4px 14px rgba(0,0,0,0.07)",fontFamily:FONT},
  th:{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontFamily:FONT,
      letterSpacing:"0.6px",textTransform:"uppercase",fontWeight:700},
  td:{padding:"12px 16px",fontFamily:FONT,fontSize:"13px"},
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

  /* Decode department from JWT */
  const userDept = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.department || "";
    } catch { return ""; }
  })();

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
  const [eRoll,      setERoll]      = useState("");
  const [eStud,      setEStud]      = useState(null);
  const [eErr,       setEErr]       = useState("");
  const [eType,      setEType]      = useState("");
  const [eSkill,     setESkill]     = useState("");
  const [eSkillPts,  setESkillPts]  = useState("");
  const [eActType,   setEActType]   = useState("");
  const [eActDesc,   setEActDesc]   = useState("");
  const [eActPts,    setEActPts]    = useState("");
  const [eAchName,   setEAchName]   = useState("");
  const [eAchPts,    setEAchPts]    = useState("");
  const [eEditId,    setEEditId]    = useState(null);  /* null = adding, id = editing */
  const [expandedRow, setExpandedRow] = useState(null);
  const [eData,      setEData]      = useState(null);
  const [eScore,     setEScore]     = useState(null);
  const [eMsg,       setEMsg]       = useState("");

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
  const ACT_PTS = {"Club":10,"Workshop":15,"NSS":20,"NCC":25,"Sports":15,"Leadership":20,"Volunteering":15};
  const resetEForm = () => { setEType(""); setESkill(""); setESkillPts(""); setEActType(""); setEActDesc(""); setEActPts(""); setEAchName(""); setEAchPts(""); setEEditId(null); };

  const setSkill = async () => {
    if(!eStud||!eSkill||!eSkillPts){setEMsg("❌ Enter skill name and points");return;}
    const r=await fetch("http://localhost:5000/admin/student-skill",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,skill_level:eSkill,skill_score:Number(eSkillPts)})});
    const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg(`✅ Skill saved — ${eSkill} (${eSkillPts} pts)`);
    resetEForm(); loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const addAct = async () => {
    if(!eStud||!eActType){setEMsg("❌ Select activity type");return;}
    const pts = Number(eActPts) || ACT_PTS[eActType] || 10;
    if(eEditId) {
      const r=await fetch(`http://localhost:5000/admin/student-activity/${eEditId}`,{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({activity_type:eActType,description:eActDesc,points:pts})});
      const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
      setEMsg("✅ Activity updated");
    } else {
      const r=await fetch("http://localhost:5000/admin/student-activity",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,activity_type:eActType,description:eActDesc,points:pts})});
      const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
      setEMsg("✅ Activity added");
    }
    resetEForm(); loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const delAct = async id => {
    await fetch(`http://localhost:5000/admin/student-activity/${id}`,{method:"DELETE",headers:getAuth()});
    loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
  };
  const addAch = async () => {
    if(!eStud||!eAchName||!eAchPts){setEMsg("❌ Fill achievement name and points");return;}
    if(eEditId) {
      const r=await fetch(`http://localhost:5000/admin/student-achievement/${eEditId}`,{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({achievement_name:eAchName,points:Number(eAchPts)})});
      const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
      setEMsg("✅ Achievement updated");
    } else {
      const r=await fetch("http://localhost:5000/admin/student-achievement",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,achievement_name:eAchName,points:Number(eAchPts)})});
      const d=await r.json(); if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
      setEMsg("✅ Achievement added");
    }
    resetEForm(); loadEData(eStud.id); loadEScore(eStud.id); loadAllEff();
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html,body,#root{height:auto!important;overflow-y:auto!important;overflow-x:hidden;font-family:'Inter','Segoe UI',sans-serif!important}
        *{font-family:'Inter','Segoe UI',sans-serif}
      `}</style>
      <Box sx={{display:"flex",alignItems:"flex-start"}}>
        <CssBaseline/>

        {/* AppBar */}
        <AppBar position="fixed" sx={{width:`calc(100% - ${drawerWidth}px)`,ml:`${drawerWidth}px`,background:"linear-gradient(90deg,#1e3c72,#2a5298)"}}>
          <Toolbar>
            <Typography variant="h6" noWrap sx={{fontWeight:700,fontFamily:"'Inter','Segoe UI',sans-serif"}}>{tab}</Typography>
            {userDept && (
              <span style={{marginLeft:"12px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",
                padding:"3px 12px",borderRadius:"999px",fontSize:"12px",fontWeight:600,letterSpacing:"0.3px"}}>
                {userDept}
              </span>
            )}
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer variant="permanent" anchor="left" sx={{width:drawerWidth,flexShrink:0,
          "& .MuiDrawer-paper":{width:drawerWidth,boxSizing:"border-box",
            background:"linear-gradient(180deg,#1e3c72,#2a5298)",color:"#fff",
            display:"flex",flexDirection:"column"}}}>
          <Toolbar sx={{justifyContent:"center",flexDirection:"column",py:1.5}}>
            <Typography variant="h6" sx={{fontWeight:700,color:"#fff",lineHeight:1.2}}>SLEA Admin</Typography>
            {userDept && (
              <Typography sx={{fontSize:"11px",color:"rgba(255,255,255,0.65)",fontWeight:500,letterSpacing:"0.5px",
                textTransform:"uppercase",mt:"2px"}}>{userDept} Dept</Typography>
            )}
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
                <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Inter','Segoe UI',sans-serif"}}>
                  <thead>
                    <tr style={{background:"linear-gradient(90deg,#1e293b,#0f172a)",color:"#fff"}}>
                      {["#","Student","Roll No","CGPA","Att %","Score /100","Band","Dept Rank","Overall Rank",""].map(h=>(
                        <th key={h} style={{...S.th,whiteSpace:"nowrap",borderBottom:"2px solid #334155",color:"#94a3b8",padding:"10px 12px"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allEff.map((e,i)=>{
                      const bc = bandColor(e.band);
                      const pctColor = p => p>=75?"#16a34a":p>=50?"#2563eb":"#dc2626";
                      const pctBg    = p => p>=75?"#dcfce7":p>=50?"#dbeafe":"#fee2e2";
                      const pctIcon  = p => p>=90?"🏆":p>=50?"📈":"📉";
                      const attRec = attendance.find(a=>a.student_id===e.id||a.student_name===e.name);
                      const attPct = attRec
                        ? attRec.present_days&&attRec.total_days>0
                          ? ((attRec.present_days/attRec.total_days)*100).toFixed(1)
                          : Number(attRec.attendance_percentage||0).toFixed(1)
                        : null;
                      const isExpanded = expandedRow===e.id;
                      const PctBadge = ({label,val}) => (
                        <span style={{display:"inline-flex",alignItems:"center",gap:"3px",
                          background:pctBg(val??0),color:pctColor(val??0),
                          padding:"3px 9px",borderRadius:"999px",fontSize:"11px",
                          fontWeight:700,border:`1px solid ${pctColor(val??0)}30`,whiteSpace:"nowrap"}}>
                          {pctIcon(val??0)} {label} {val??0}%
                        </span>
                      );
                      return (
                        <React.Fragment key={e.id}>
                          <tr style={{borderBottom: isExpanded?"none":"1px solid #f1f5f9", background: isExpanded?"#f8faff":"transparent"}}
                            onMouseEnter={ev=>{if(!isExpanded)ev.currentTarget.style.background="#f8fafc"}}
                            onMouseLeave={ev=>{if(!isExpanded)ev.currentTarget.style.background="transparent"}}>
                            <td style={{...S.td,color:"#94a3b8",fontWeight:600,fontSize:"13px",padding:"10px 12px"}}>{i+1}</td>
                            <td style={{...S.td,fontWeight:700,fontSize:"13px",padding:"10px 12px"}}>{e.name}</td>
                            <td style={{...S.td,fontFamily:"monospace",fontSize:"12px",color:"#475569",padding:"10px 12px"}}>{e.rollno}</td>
                            <td style={{...S.td,padding:"10px 12px"}}>
                              <span style={{fontWeight:700,fontSize:"14px",color:"#0891b2"}}>{e.cgpa}</span>
                            </td>
                            <td style={{...S.td,padding:"10px 12px"}}>
                              {attPct!=null
                                ? <span style={{fontWeight:700,fontSize:"13px",color:parseFloat(attPct)>=75?"#16a34a":"#dc2626"}}>{attPct}%</span>
                                : <span style={{fontSize:"12px",color:"#cbd5e1"}}>—</span>}
                            </td>
                            <td style={{...S.td,padding:"10px 12px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                                <div style={{width:"36px",height:"5px",background:"#f1f5f9",borderRadius:"3px",overflow:"hidden"}}>
                                  <div style={{height:"100%",width:`${e.finalScore}%`,background:bc,borderRadius:"3px"}}/>
                                </div>
                                <span style={{fontWeight:800,fontSize:"14px",color:bc}}>{e.finalScore}</span>
                              </div>
                            </td>
                            <td style={{...S.td,padding:"10px 12px"}}>
                              <span style={{padding:"3px 9px",borderRadius:"999px",fontSize:"11px",fontWeight:700,
                                background:bc+"18",color:bc,border:`1px solid ${bc}44`,whiteSpace:"nowrap"}}>
                                {e.band}
                              </span>
                            </td>
                            <td style={{...S.td,textAlign:"center",padding:"10px 12px"}}>
                              <span style={{fontWeight:800,fontSize:"15px",color:"#7c3aed"}}>#{e.deptRank??'—'}</span>
                              <span style={{fontSize:"10px",color:"#94a3b8",display:"block"}}>of {e.deptTotal??'—'}</span>
                            </td>
                            <td style={{...S.td,textAlign:"center",padding:"10px 12px"}}>
                              <span style={{fontWeight:800,fontSize:"15px",color:"#2563eb"}}>#{e.overallRank??'—'}</span>
                              <span style={{fontSize:"10px",color:"#94a3b8",display:"block"}}>of {e.overallTotal??'—'}</span>
                            </td>
                            {/* Expand toggle */}
                            <td style={{...S.td,padding:"10px 12px",textAlign:"center"}}>
                              <button onClick={()=>setExpandedRow(isExpanded?null:e.id)} style={{
                                background: isExpanded?"#e0e7ff":"#f1f5f9",
                                border:"none",borderRadius:"6px",padding:"4px 10px",
                                fontSize:"11px",fontWeight:600,cursor:"pointer",
                                color: isExpanded?"#4338ca":"#64748b",
                              }}>
                                {isExpanded?"▲ Hide":"▼ Peers"}
                              </button>
                            </td>
                          </tr>
                          {/* Expandable peer comparison row */}
                          {isExpanded && (
                            <tr style={{borderBottom:"1px solid #f1f5f9",background:"#f8faff"}}>
                              <td colSpan={10} style={{padding:"8px 16px 16px 16px"}}>
                                <div style={{display:"flex",gap:"24px",flexWrap:"wrap"}}>
                                  <div>
                                    <div style={{fontSize:"10px",fontWeight:700,color:"#7c3aed",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"6px"}}>Peer Comparison — Department</div>
                                    <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                                      <PctBadge label="Skills"   val={e.deptPercentile?.skill}/>
                                      <PctBadge label="Achieve"  val={e.deptPercentile?.achievement}/>
                                      <PctBadge label="Activity" val={e.deptPercentile?.activity}/>
                                      <PctBadge label="CGPA"     val={e.deptPercentile?.cgpa}/>
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{fontSize:"10px",fontWeight:700,color:"#2563eb",letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"6px"}}>Peer Comparison — Overall</div>
                                    <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                                      <PctBadge label="Skills"   val={e.allPercentile?.skill}/>
                                      <PctBadge label="Achieve"  val={e.allPercentile?.achievement}/>
                                      <PctBadge label="Activity" val={e.allPercentile?.activity}/>
                                      <PctBadge label="CGPA"     val={e.allPercentile?.cgpa}/>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {allEff.length===0&&(
                      <tr><td colSpan={10} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"32px",fontSize:"14px"}}>
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
              <Typography sx={{color:"#64748b",mb:3,fontSize:"13px"}}>
                Score = Skills×30% + Achievements×20% + Activities×20% + CGPA×30% (peer-normalised)
              </Typography>
              <MsgBox msg={eMsg}/>

              {/* ── Step 1: Select Student ── */}
              <Box sx={{...S.card,maxWidth:480,mb:3}}>
                <Typography sx={{fontWeight:600,mb:1,fontSize:"13px",color:"#475569"}}>Select Student</Typography>
                <RollInput value={eRoll}
                  onChange={v=>{setERoll(v);setEData(null);setEScore(null);resetEForm();rollChange(v,setERoll,setEStud,setEErr);}}
                  onSelect={s=>{setEStud(s);setERoll(s.rollno);setEErr("");setEData(null);setEScore(null);resetEForm();}}
                  pool={students}/>
                <FoundBanner student={eStud} error={eErr}/>
              </Box>

              {eStud && (
                <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start"}}>

                  {/* LEFT — Add/Edit form (like subjects form card) */}
                  <Box sx={{flex:"0 0 340px"}}>
                    <Box sx={{...S.card,border:`2px solid ${eEditId?"#f59e0b":"#e2e8f0"}`,
                      background:eEditId?"#fffbeb":"#fff",mb:3}}>

                      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
                        <Typography sx={{fontWeight:700,fontSize:"15px",color:"#0f172a"}}>
                          {eEditId?"✏️ Edit Entry":"➕ Add Entry"}
                        </Typography>
                        {eEditId && (
                          <button onClick={resetEForm} style={{background:"none",border:"1px solid #cbd5e1",
                            borderRadius:"6px",padding:"3px 10px",fontSize:"12px",cursor:"pointer",color:"#64748b"}}>
                            ✕ Cancel
                          </button>
                        )}
                      </Box>

                      {/* Type selector */}
                      <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Type</Typography>
                      <select style={{...S.inp}} value={eType} disabled={!!eEditId}
                        onChange={e=>{setEType(e.target.value);setESkill("");setESkillPts("");setEActType("");setEActDesc("");setEActPts("");setEAchName("");setEAchPts("");}}>
                        <option value="">— Select —</option>
                        <option value="skill">🎯 Skill Level</option>
                        <option value="activity">🏃 Activity</option>
                        <option value="achievement">🏆 Achievement</option>
                      </select>

                      {eType==="skill" && (<>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Skill / Level Name</Typography>
                        <input style={S.inp} placeholder="e.g. Python Expert" value={eSkill} onChange={e=>setESkill(e.target.value)}/>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Points</Typography>
                        <input style={S.inp} type="number" placeholder="e.g. 75" value={eSkillPts} onChange={e=>setESkillPts(e.target.value)}/>
                        <button style={S.btn} onClick={setSkill}>Save Skill</button>
                      </>)}

                      {eType==="activity" && (<>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Activity Type</Typography>
                        <select style={S.inp} value={eActType}
                          onChange={e=>{setEActType(e.target.value);if(!eActPts)setEActPts(String(ACT_PTS[e.target.value]||"")); }}>
                          <option value="">Select activity</option>
                          {Object.entries(ACT_PTS).map(([t,p])=>(
                            <option key={t} value={t}>{t} — default {p} pts</option>
                          ))}
                        </select>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Description <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></Typography>
                        <input style={S.inp} placeholder="e.g. Blood donation camp" value={eActDesc} onChange={e=>setEActDesc(e.target.value)}/>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Points</Typography>
                        <input style={S.inp} type="number" placeholder="e.g. 20" value={eActPts} onChange={e=>setEActPts(e.target.value)}/>
                        <button style={S.btn} onClick={addAct}>{eEditId?"Update Activity":"Add Activity"}</button>
                      </>)}

                      {eType==="achievement" && (<>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Achievement Name</Typography>
                        <input style={S.inp} placeholder="e.g. State Level Chess Winner" value={eAchName} onChange={e=>setEAchName(e.target.value)}/>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Points</Typography>
                        <input style={S.inp} type="number" placeholder="e.g. 30" value={eAchPts} onChange={e=>setEAchPts(e.target.value)}/>
                        <button style={S.btn} onClick={addAch}>{eEditId?"Update Achievement":"Add Achievement"}</button>
                      </>)}
                    </Box>

                    {/* Score card — peer comparison */}
                    {eScore && (() => {
                      /* ── CHANGE COLORS HERE ─────────────────────────────
                         Top tier  (≥75%) : text / background / border
                         Mid tier  (≥50%) : text / background / border
                         Low tier  (<50%) : text / background / border      */
                      const COLOR_TOP_TEXT   = "#059669";   /* emerald-600   */
                      const COLOR_TOP_BG     = "#d1fae5";   /* emerald-100   */
                      const COLOR_TOP_BORDER = "#6ee7b7";   /* emerald-300   */

                      const COLOR_MID_TEXT   = "#7c3aed";   /* violet-600    */
                      const COLOR_MID_BG     = "#ede9fe";   /* violet-100    */
                      const COLOR_MID_BORDER = "#c4b5fd";   /* violet-300    */

                      const COLOR_LOW_TEXT   = "#e11d48";   /* rose-600      */
                      const COLOR_LOW_BG     = "#ffe4e6";   /* rose-100      */
                      const COLOR_LOW_BORDER = "#fda4af";   /* rose-300      */

                      /* DEPT badge colors (fixed, not percentile-based) */
                      const COLOR_DEPT_TEXT   = "#0369a1";  /* sky-700       */
                      const COLOR_DEPT_BG     = "#e0f2fe";  /* sky-100       */
                      const COLOR_DEPT_BORDER = "#7dd3fc";  /* sky-300       */

                      /* OVERALL badge colors */
                      const COLOR_ALL_TEXT    = "#c2410c";  /* orange-700    */
                      const COLOR_ALL_BG      = "#ffedd5";  /* orange-100    */
                      const COLOR_ALL_BORDER  = "#fdba74";  /* orange-300    */

                      /* DEPT RANK badge */
                      const COLOR_DRANK_TEXT  = "#6d28d9";  /* violet-700    */
                      const COLOR_DRANK_BG    = "#f5f3ff";  /* violet-50     */
                      const COLOR_DRANK_BORDER= "#ddd6fe";  /* violet-200    */

                      /* OVERALL RANK badge */
                      const COLOR_ORANK_TEXT  = "#1d4ed8";  /* blue-700      */
                      const COLOR_ORANK_BG    = "#eff6ff";  /* blue-50       */
                      const COLOR_ORANK_BORDER= "#bfdbfe";  /* blue-200      */

                      /* BAR colors */
                      const COLOR_BAR_DEPT    = "#0ea5e9";  /* sky-500       */
                      const COLOR_BAR_ALL     = "#f97316";  /* orange-500    */
                      /* ─────────────────────────────────────────────────── */

                      const pctColor = p => p>=75?COLOR_TOP_TEXT:p>=50?COLOR_MID_TEXT:COLOR_LOW_TEXT;
                      const pctBg    = p => p>=75?COLOR_TOP_BG:p>=50?COLOR_MID_BG:COLOR_LOW_BG;
                      const pctBorder= p => p>=75?COLOR_TOP_BORDER:p>=50?COLOR_MID_BORDER:COLOR_LOW_BORDER;
                      const icon     = p => p>=90?"🏆":p>=75?"🥇":p>=50?"📈":"📉";
                      const params = [
                        { label:"Skills",       emoji:"🎯", dept:eScore.deptPercentile?.skill,       all:eScore.allPercentile?.skill       },
                        { label:"Achievements", emoji:"🏆", dept:eScore.deptPercentile?.achievement, all:eScore.allPercentile?.achievement  },
                        { label:"Activities",   emoji:"🏃", dept:eScore.deptPercentile?.activity,    all:eScore.allPercentile?.activity     },
                        { label:"CGPA",         emoji:"📚", dept:eScore.deptPercentile?.cgpa,        all:eScore.allPercentile?.cgpa         },
                      ];
                      return (
                        <Box sx={{...S.card,border:`2px solid ${bandColor(eScore.band)}22`}}>
                          {/* Header — score + band + ranks */}
                          <Box sx={{textAlign:"center",mb:2,pb:2,borderBottom:"1px solid #f1f5f9"}}>
                            <Typography sx={{fontSize:"11px",fontWeight:700,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase",mb:0.5}}>Overall Score</Typography>
                            <Typography sx={{fontSize:"48px",fontWeight:800,color:bandColor(eScore.band),lineHeight:1}}>{eScore.finalScore}</Typography>
                            <span style={{display:"inline-block",marginTop:"6px",padding:"3px 14px",borderRadius:"999px",fontWeight:700,fontSize:"12px",
                              background:bandColor(eScore.band)+"22",color:bandColor(eScore.band),border:`1px solid ${bandColor(eScore.band)}`}}>
                              {eScore.band}
                            </span>
                            {/* Rank badges */}
                            <Box sx={{display:"flex",justifyContent:"center",gap:1.5,mt:1.5}}>
                              <Box sx={{background:COLOR_DRANK_BG,border:`1px solid ${COLOR_DRANK_BORDER}`,borderRadius:"8px",px:1.5,py:0.5,textAlign:"center"}}>
                                <Typography sx={{fontSize:"10px",color:COLOR_DRANK_TEXT,fontWeight:600}}>DEPT RANK</Typography>
                                <Typography sx={{fontSize:"16px",fontWeight:800,color:COLOR_DRANK_TEXT,lineHeight:1.2}}>
                                  #{eScore.deptRank ?? "—"}<span style={{fontSize:"10px",fontWeight:400,color:"#94a3b8"}}> /{eScore.deptTotal ?? "—"}</span>
                                </Typography>
                              </Box>
                              <Box sx={{background:COLOR_ORANK_BG,border:`1px solid ${COLOR_ORANK_BORDER}`,borderRadius:"8px",px:1.5,py:0.5,textAlign:"center"}}>
                                <Typography sx={{fontSize:"10px",color:COLOR_ORANK_TEXT,fontWeight:600}}>OVERALL RANK</Typography>
                                <Typography sx={{fontSize:"16px",fontWeight:800,color:COLOR_ORANK_TEXT,lineHeight:1.2}}>
                                  #{eScore.overallRank ?? "—"}<span style={{fontSize:"10px",fontWeight:400,color:"#94a3b8"}}> /{eScore.overallTotal ?? "—"}</span>
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Overall percentile row — Dept (sky) + Overall (orange), fixed colors */}
                          <Box sx={{display:"flex",gap:1,mb:2}}>
                            <Box sx={{flex:1,background:COLOR_DEPT_BG,border:`1px solid ${COLOR_DEPT_BORDER}`,borderRadius:"8px",p:"8px",textAlign:"center"}}>
                              <Typography sx={{fontSize:"10px",fontWeight:700,color:COLOR_DEPT_TEXT,textTransform:"uppercase",letterSpacing:"0.4px"}}>Dept</Typography>
                              <Typography sx={{fontSize:"22px",fontWeight:800,color:COLOR_DEPT_TEXT,lineHeight:1.2}}>{eScore.deptPercentile?.overall??0}%</Typography>
                              <Typography sx={{fontSize:"10px",color:COLOR_DEPT_TEXT,fontWeight:500}}>better than dept {icon(eScore.deptPercentile?.overall??0)}</Typography>
                            </Box>
                            <Box sx={{flex:1,background:COLOR_ALL_BG,border:`1px solid ${COLOR_ALL_BORDER}`,borderRadius:"8px",p:"8px",textAlign:"center"}}>
                              <Typography sx={{fontSize:"10px",fontWeight:700,color:COLOR_ALL_TEXT,textTransform:"uppercase",letterSpacing:"0.4px"}}>Overall</Typography>
                              <Typography sx={{fontSize:"22px",fontWeight:800,color:COLOR_ALL_TEXT,lineHeight:1.2}}>{eScore.allPercentile?.overall??0}%</Typography>
                              <Typography sx={{fontSize:"10px",color:COLOR_ALL_TEXT,fontWeight:500}}>better than all {icon(eScore.allPercentile?.overall??0)}</Typography>
                            </Box>
                          </Box>

                          {/* Per-parameter comparison */}
                          <Typography sx={{fontSize:"11px",fontWeight:700,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase",mb:1}}>Parameter Breakdown</Typography>
                          {params.map(({label,emoji,dept,all})=>{
                            const d = dept??0, a = all??0;
                            return (
                              <Box key={label} sx={{mb:1.5,background:"#f8fafc",borderRadius:"8px",p:"10px 12px",border:"1px solid #f1f5f9"}}>
                                <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:0.8}}>
                                  <Typography sx={{fontSize:"12px",fontWeight:700,color:"#1e293b"}}>{emoji} {label}</Typography>
                                  <Box sx={{display:"flex",gap:0.8}}>
                                    <span style={{background:COLOR_DEPT_BG,color:COLOR_DEPT_TEXT,border:`1px solid ${COLOR_DEPT_BORDER}`,
                                      padding:"2px 8px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>
                                      Dept {d}%
                                    </span>
                                    <span style={{background:COLOR_ALL_BG,color:COLOR_ALL_TEXT,border:`1px solid ${COLOR_ALL_BORDER}`,
                                      padding:"2px 8px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>
                                      All {a}%
                                    </span>
                                  </Box>
                                </Box>
                                {/* Dual bar — sky for dept, orange for all */}
                                <Box sx={{display:"flex",flexDirection:"column",gap:"4px"}}>
                                  <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                                    <Typography sx={{fontSize:"9px",color:COLOR_DEPT_TEXT,fontWeight:600,width:"28px"}}>Dept</Typography>
                                    <Box sx={{flex:1,height:"6px",background:"#e0f2fe",borderRadius:"3px",overflow:"hidden"}}>
                                      <Box sx={{height:"100%",width:`${d}%`,background:COLOR_BAR_DEPT,borderRadius:"3px"}}/>
                                    </Box>
                                    <Typography sx={{fontSize:"9px",fontWeight:700,color:COLOR_DEPT_TEXT,width:"26px",textAlign:"right"}}>{d}%</Typography>
                                  </Box>
                                  <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                                    <Typography sx={{fontSize:"9px",color:COLOR_ALL_TEXT,fontWeight:600,width:"28px"}}>All</Typography>
                                    <Box sx={{flex:1,height:"6px",background:"#ffedd5",borderRadius:"3px",overflow:"hidden"}}>
                                      <Box sx={{height:"100%",width:`${a}%`,background:COLOR_BAR_ALL,borderRadius:"3px"}}/>
                                    </Box>
                                    <Typography sx={{fontSize:"9px",fontWeight:700,color:COLOR_ALL_TEXT,width:"26px",textAlign:"right"}}>{a}%</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}

                          {/* CGPA footer */}
                          <Box sx={{mt:1,pt:1.5,borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <Typography sx={{fontSize:"12px",color:"#64748b"}}>CGPA</Typography>
                            <Typography sx={{fontWeight:800,fontSize:"18px",color:"#0891b2"}}>{eScore.cgpa}</Typography>
                          </Box>
                        </Box>
                      );
                    })()}

                  </Box>

                  {/* RIGHT — entries list (like subjects table) */}
                  <Box sx={{flex:"1 1 400px"}}>
                    <Typography variant="h6" sx={{fontWeight:700,mb:2,fontSize:"15px"}}>
                      Entries ({(!!eData?.skill?1:0) + (eData?.activities||[]).length + (eData?.achievements||[]).length})
                    </Typography>

                    <Box sx={{...S.card,p:0,overflow:"hidden"}}>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#1e293b",color:"#fff"}}>
                            {["#","Type","Name / Description","Points","Actions"].map(h=>(
                              <th key={h} style={{...S.th,color:"#94a3b8",padding:"10px 14px"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Skill row */}
                          {eData?.skill && (
                            <tr style={{borderBottom:"1px solid #f1f5f9"}}
                              onMouseEnter={ev=>ev.currentTarget.style.background="#f5f3ff"}
                              onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                              <td style={{...S.td,color:"#94a3b8",padding:"10px 14px"}}>1</td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <span style={{background:"#ede9fe",color:"#7c3aed",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>🎯 Skill</span>
                              </td>
                              <td style={{...S.td,fontWeight:600,padding:"10px 14px"}}>{eData.skill.skill_level}</td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <span style={{background:"#ede9fe",color:"#7c3aed",padding:"2px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700}}>{eData.skill.skill_score} pts</span>
                              </td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <IconButton size="small" sx={{color:"#f59e0b",mr:0.5}} onClick={()=>{
                                  setEType("skill");setESkill(eData.skill.skill_level);setESkillPts(String(eData.skill.skill_score));setEEditId("skill");
                                }}><EditIcon fontSize="small"/></IconButton>
                              </td>
                            </tr>
                          )}
                          {/* Activity rows */}
                          {(eData?.activities||[]).map((a,idx)=>(
                            <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}
                              onMouseEnter={ev=>ev.currentTarget.style.background="#eff6ff"}
                              onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                              <td style={{...S.td,color:"#94a3b8",padding:"10px 14px"}}>{(eData?.skill?2:1)+idx}</td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <span style={{background:"#dbeafe",color:"#2563eb",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>🏃 Activity</span>
                              </td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <Typography sx={{fontSize:"13px",fontWeight:600}}>{a.activity_type}</Typography>
                                {a.description&&<Typography sx={{fontSize:"11px",color:"#64748b"}}>{a.description}</Typography>}
                              </td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <span style={{background:"#dbeafe",color:"#2563eb",padding:"2px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700}}>{a.points} pts</span>
                              </td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <IconButton size="small" sx={{color:"#f59e0b",mr:0.5}} onClick={()=>{
                                  setEType("activity");setEActType(a.activity_type);setEActDesc(a.description||"");setEActPts(String(a.points));setEEditId(a.id);
                                }}><EditIcon fontSize="small"/></IconButton>
                                <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAct(a.id)}><DeleteIcon fontSize="small"/></IconButton>
                              </td>
                            </tr>
                          ))}
                          {/* Achievement rows */}
                          {(eData?.achievements||[]).map((a,idx)=>(
                            <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}
                              onMouseEnter={ev=>ev.currentTarget.style.background="#fffbeb"}
                              onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                              <td style={{...S.td,color:"#94a3b8",padding:"10px 14px"}}>{(eData?.skill?2:1)+(eData?.activities||[]).length+idx}</td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <span style={{background:"#fef3c7",color:"#d97706",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>🏆 Achievement</span>
                              </td>
                              <td style={{...S.td,fontWeight:600,padding:"10px 14px"}}>{a.achievement_name}</td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <span style={{background:"#fef3c7",color:"#d97706",padding:"2px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700}}>{a.points} pts</span>
                              </td>
                              <td style={{...S.td,padding:"10px 14px"}}>
                                <IconButton size="small" sx={{color:"#f59e0b",mr:0.5}} onClick={()=>{
                                  setEType("achievement");setEAchName(a.achievement_name);setEAchPts(String(a.points));setEEditId(a.id);
                                }}><EditIcon fontSize="small"/></IconButton>
                                <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAch(a.id)}><DeleteIcon fontSize="small"/></IconButton>
                              </td>
                            </tr>
                          ))}
                          {!eData?.skill && (eData?.activities||[]).length===0 && (eData?.achievements||[]).length===0 && (
                            <tr><td colSpan={5} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"32px",fontSize:"13px"}}>
                              No entries yet — use the form to add skill, activities or achievements
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </Box>
                  </Box>

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