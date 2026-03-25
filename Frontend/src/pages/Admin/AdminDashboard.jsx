import React, { useState, useEffect, useRef, useCallback } from "react";
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
import GroupsIcon from "@mui/icons-material/Groups";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const drawerWidth = 240;

const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];
const PAGE_SIZES = [5, 25, 100, 1000];
const ACT_PTS = { Club:10, Workshop:15, NSS:20, NCC:25, Sports:15, Leadership:20, Volunteering:15 };

const MENU = [
  { label:"Dashboard",     icon:<DashboardIcon/>      },
  { label:"Students",      icon:<PeopleIcon/>         },
  { label:"Subjects",      icon:<MenuBookIcon/>       },
  { label:"Marks",         icon:<GradeIcon/>          },
  { label:"Attendance",    icon:<EventAvailableIcon/> },
  { label:"Efficiency",    icon:<EmojiEventsIcon/>    },
  { label:"Announcements", icon:<AnnouncementIcon/>   },
  { label:"Faculty",       icon:<GroupsIcon/>         },
  { label:"Password",      icon:<LockIcon/>           },
];

const getAuth = () => ({ Authorization:`Bearer ${localStorage.getItem("token")}` });

const FONT = "'Inter','Segoe UI',sans-serif";

const S = {
  inp:{width:"100%",padding:"10px 14px",fontSize:"14px",borderRadius:"8px",
       border:"1px solid #cbd5e1",outline:"none",marginBottom:"12px",
       boxSizing:"border-box",fontFamily:FONT,background:"#fff",color:"#0f172a"},
  btn:{width:"100%",padding:"12px",background:"linear-gradient(90deg,#1e3c72,#2a5298)",
       color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:600,
       cursor:"pointer",fontFamily:FONT,letterSpacing:"0.3px"},
  card:{background:"#fff",borderRadius:"12px",padding:"24px",
        boxShadow:"0 4px 14px rgba(0,0,0,0.07)",fontFamily:FONT},
  th:{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontFamily:FONT,
      letterSpacing:"0.6px",textTransform:"uppercase",fontWeight:700},
  td:{padding:"12px 16px",fontFamily:FONT,fontSize:"13px",color:"#000"},
};

/* ── Sort helpers ── */
const useSortState = () => {
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState("asc");
  const toggle = col => {
    if (sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const sort = (arr, keyFn) => {
    if (!sortCol) return arr;
    return [...arr].sort((a,b)=>{
      const va=keyFn(a,sortCol), vb=keyFn(b,sortCol);
      const n=typeof va==="number"&&typeof vb==="number"?va-vb:String(va??'').localeCompare(String(vb??''));
      return sortDir==="asc"?n:-n;
    });
  };
  return {sortCol,sortDir,toggle,sort};
};

const SortTh = ({label,col,sortCol,sortDir,onToggle,style={}}) => (
  <th onClick={()=>onToggle(col)} style={{
    ...S.th,cursor:"pointer",userSelect:"none",
    whiteSpace:"nowrap",position:"relative",paddingRight:"28px",...style
  }}>
    {label}
    <span style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",
      fontSize:"13px",opacity:sortCol===col?1:0.3,color:sortCol===col?"#93c5fd":"#fff"}}>
      {sortCol===col?(sortDir==="asc"?"↑":"↓"):"↕"}
    </span>
  </th>
);

/* ── Pagination ── */
function usePagination(data, defaultSize=25) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(defaultSize);
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total/size));
  const slice = data.slice((page-1)*size, page*size);
  useEffect(()=>{ if (page>pages) setPage(1); },[size,data.length]);
  const changeSize = s => { setSize(s); setPage(1); };
  return {slice,page,setPage,size,changeSize,total,pages};
}

function PaginationBar({ page, pages, size, changeSize, setPage, total }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderTop: "1px solid #f1f5f9",
        flexWrap: "wrap",
        gap: "10px",
        background: "#fafafa",
        borderRadius: "0 0 12px 12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "#64748b" }}>Rows per page:</span>

        {/* 🔽 DROPDOWN ADDED HERE */}
        <select
          value={size}
          onChange={(e) => changeSize(Number(e.target.value))}
          style={{
            padding: "6px 10px",
            borderRadius: "7px",
            border: "1.5px solid #e2e8f0",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            background: "#fff",
            fontFamily: FONT,
            outline: "none",
          }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: 4 }}>
          {total} total
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          style={{
            padding: "5px 10px",
            borderRadius: "7px",
            fontSize: "12px",
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            cursor: "pointer",
            opacity: page === 1 ? 0.4 : 1,
          }}
        >
          «
        </button>

        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1}
          style={{
            padding: "5px 10px",
            borderRadius: "7px",
            fontSize: "12px",
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            cursor: "pointer",
            opacity: page === 1 ? 0.4 : 1,
          }}
        >
          ‹
        </button>

        <span style={{ fontSize: "13px", color: "#475569", padding: "0 8px" }}>
          Page {page} / {pages}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page === pages}
          style={{
            padding: "5px 10px",
            borderRadius: "7px",
            fontSize: "12px",
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            cursor: "pointer",
            opacity: page === pages ? 0.4 : 1,
          }}
        >
          ›
        </button>

        <button
          onClick={() => setPage(pages)}
          disabled={page === pages}
          style={{
            padding: "5px 10px",
            borderRadius: "7px",
            fontSize: "12px",
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            cursor: "pointer",
            opacity: page === pages ? 0.4 : 1,
          }}
        >
          »
        </button>
      </div>
    </div>
  );
}

const bandColor = b =>
  b==="Excellent"?"#16a34a":b==="Good"?"#2563eb":
  b==="Needs Improvement"?"#d97706":"#dc2626";

/* ── Roll-no autocomplete ── */
function RollInput({value,onChange,onSelect,pool,label="Student Roll Number"}) {
  const [hits,setHits] = useState([]);
  const [show,setShow] = useState(false);
  const wrap = useRef();
  useEffect(()=>{
    if (value.trim().length<2){setHits([]);setShow(false);return;}
    const q=value.trim().toLowerCase();
    const m=pool.filter(s=>s.rollno.toLowerCase().startsWith(q)).slice(0,8);
    setHits(m);setShow(m.length>0);
  },[value,pool]);
  useEffect(()=>{
    const fn=e=>{if(wrap.current&&!wrap.current.contains(e.target))setShow(false);};
    document.addEventListener("mousedown",fn);
    return ()=>document.removeEventListener("mousedown",fn);
  },[]);
  return (
    <div ref={wrap} style={{position:"relative",marginBottom:"14px"}}>
      <Typography sx={{fontSize:"13px",fontWeight:600,color:"#475569",mb:0.5}}>{label}</Typography>
      <input
        style={{...S.inp,marginBottom:0,
          border:pool.find(s=>s.rollno.toLowerCase()===value.trim().toLowerCase())
            ?"2px solid #16a34a":"1px solid #cbd5e1"}}
        placeholder="Enter roll number e.g. 7376232AL1…"
        value={value} onChange={e=>onChange(e.target.value)} autoComplete="off"
      />
      {show && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:9999,
          background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",
          boxShadow:"0 8px 24px rgba(0,0,0,0.13)",overflow:"hidden"}}>
          {hits.map(s=>(
            <div key={s.id} onMouseDown={()=>{onSelect(s);setShow(false);}}
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

function FoundBanner({student,error}) {
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
  const ok=msg.startsWith("✅");
  return (
    <Box sx={{p:"10px 16px",mb:2,borderRadius:"8px",fontWeight:500,
      background:ok?"#dcfce7":"#fee2e2",color:ok?"#16a34a":"#dc2626",
      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span>{msg}</span>
    </Box>
  );
}

/* ── Edit Student Modal ── */
function EditStudentModal({student,onClose,onSave}) {
  const [form,setForm] = useState({
    name:student.name||"",email:student.email||"",
    phone:student.phone||"",is_active:student.is_active!==0,
  });
  const [err,setErr] = useState("");
  const handleSave = () => {
    if (!form.name.trim()){setErr("Name is required");return;}
    if (!form.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){setErr("Valid email required");return;}
    if (form.phone&&!/^[6-9]\d{9}$/.test(form.phone)){setErr("Phone must be 10 digits starting 6-9");return;}
    onSave(student.id,{name:form.name,email:form.email,phone:form.phone,is_active:form.is_active});
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"28px",
        width:"100%",maxWidth:"460px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <Typography variant="h6" sx={{fontWeight:700,mb:2}}>✏️ Edit Student</Typography>
        {err&&<Box sx={{background:"#fee2e2",color:"#dc2626",p:"10px 14px",borderRadius:"8px",mb:2,fontSize:"14px"}}>⚠ {err}</Box>}
        {[{k:"name",lbl:"Full Name *"},{k:"email",lbl:"Email *"},{k:"phone",lbl:"Phone (optional)"}].map(f=>(
          <div key={f.k}>
            <Typography sx={{fontSize:"12px",fontWeight:600,color:"#64748b",mb:"5px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{f.lbl}</Typography>
            <input style={S.inp} value={form[f.k]} onChange={e=>{setForm(p=>({...p,[f.k]:e.target.value}));setErr("");}}/>
          </div>
        ))}
        <Typography sx={{fontSize:"12px",fontWeight:600,color:"#64748b",mb:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Status</Typography>
        <div style={{display:"flex",gap:"10px",marginBottom:"18px"}}>
          {[{v:true,lbl:"● Active",c:"#16a34a",bg:"#dcfce7"},{v:false,lbl:"○ Inactive",c:"#dc2626",bg:"#fee2e2"}].map(o=>(
            <button key={String(o.v)} onClick={()=>setForm(p=>({...p,is_active:o.v}))} style={{
              flex:1,padding:"8px",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",
              border:form.is_active===o.v?`2px solid ${o.c}`:"2px solid #e2e8f0",
              background:form.is_active===o.v?o.bg:"#f8fafc",color:form.is_active===o.v?o.c:"#64748b"}}>{o.lbl}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button style={{...S.btn,flex:1}} onClick={handleSave}>💾 Save Changes</button>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Marks Modal ── */
function EditMarksModal({mark,onClose,onSave}) {
  const [marksVal,setMarksVal] = useState(String(mark.marks_scored));
  const [err,setErr] = useState("");
  const handleSave = () => {
    const m = Number(marksVal);
    if (isNaN(m)||m<0||m>100){setErr("Marks must be 0–100");return;}
    onSave(mark.id, m);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"28px",
        width:"100%",maxWidth:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <Typography variant="h6" sx={{fontWeight:700,mb:1}}>✏️ Edit Marks</Typography>
        <Typography sx={{fontSize:"13px",color:"#64748b",mb:2}}>
          {mark.student_name} — {mark.subject_name} ({mark.semester})
        </Typography>
        {err&&<Box sx={{background:"#fee2e2",color:"#dc2626",p:"10px 14px",borderRadius:"8px",mb:2,fontSize:"14px"}}>⚠ {err}</Box>}
        <Typography sx={{fontSize:"12px",fontWeight:600,color:"#64748b",mb:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Marks (0–100)</Typography>
        <input style={S.inp} type="number" min={0} max={100} value={marksVal}
          onChange={e=>{setMarksVal(e.target.value);setErr("");}}/>
        <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
          <button style={{...S.btn,flex:1}} onClick={handleSave}>💾 Save</button>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Faculty Modal ── */
function EditFacultyModal({faculty,onClose,onSave}) {
  const [form,setForm] = useState({name:faculty.name||"",email:faculty.email||"",phone:faculty.phone||""});
  const [err,setErr] = useState("");
  const handleSave = () => {
    if (!form.name.trim()){setErr("Name required");return;}
    if (!form.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){setErr("Valid email required");return;}
    if (form.phone&&!/^[6-9]\d{9}$/.test(form.phone)){setErr("Phone must be 10 digits starting 6-9");return;}
    onSave(faculty.id,form);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:9999,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"16px",padding:"28px",
        width:"100%",maxWidth:"420px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <Typography variant="h6" sx={{fontWeight:700,mb:2}}>✏️ Edit Faculty</Typography>
        {err&&<Box sx={{background:"#fee2e2",color:"#dc2626",p:"10px 14px",borderRadius:"8px",mb:2,fontSize:"14px"}}>⚠ {err}</Box>}
        {[{k:"name",lbl:"Full Name *"},{k:"email",lbl:"Email *"},{k:"phone",lbl:"Phone (optional)"}].map(f=>(
          <div key={f.k}>
            <Typography sx={{fontSize:"12px",fontWeight:600,color:"#64748b",mb:"5px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{f.lbl}</Typography>
            <input style={S.inp} value={form[f.k]} onChange={e=>{setForm(p=>({...p,[f.k]:e.target.value}));setErr("");}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
          <button style={{...S.btn,flex:1}} onClick={handleSave}>💾 Save</button>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"#f1f5f9",color:"#475569",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab,setTab]         = useState("Dashboard");
  const [loading,setLoading] = useState(true);

  const userDept = (()=>{
    try{const p=JSON.parse(atob(localStorage.getItem("token").split(".")[1]));return p.department||"";}
    catch{return "";}
  })();

  /* ── Data ── */
  const [students,     setStudents]     = useState([]);
  const [subjects,     setSubjects]     = useState([]);
  const [marks,        setMarks]        = useState([]);
  const [attendance,   setAttendance]   = useState([]);
  const [announcements,setAnnouncements]= useState([]);
  const [replies,      setReplies]      = useState({});
  const [allEff,       setAllEff]       = useState([]);
  const [faculty,      setFaculty]      = useState([]);

  /* ── Student form ── */
  const [sName,setSName]=useState(""); const [sEmail,setSEmail]=useState("");
  const [sRoll,setSRoll]=useState(""); const [sPwd,setSPwd]=useState(""); const [sPhone,setSPhone]=useState("");
  const [sMsg,setSMsg]=useState(""); const [editStudent,setEditStudent]=useState(null);

  /* ── Subjects ── */
  const [subName,setSubName]=useState(""); const [subCred,setSubCred]=useState(""); const [subSem,setSubSem]=useState("Sem 1"); const [semTab,setSemTab]=useState("Sem 1");

  /* ── Marks: subject-wise entry mode ── */
  const [marksMode,setMarksMode]             = useState("subjectwise"); // "subjectwise" | "upload"
  const [selectedSubjectId,setSelectedSubjectId] = useState("");
  const [selectedSemForMarks,setSelectedSemForMarks] = useState("Sem 1");
  const [inlineMarks,setInlineMarks]         = useState({}); // { studentId: value }
  const [inlineSaving,setInlineSaving]       = useState({}); // { studentId: bool }
  const [editingMark,setEditingMark]         = useState(null);
  const [marksMsg,setMarksMsg]               = useState("");
  const [xlRows,setXlRows]=useState([]); const [xlMsg,setXlMsg]=useState(""); const [xlLoading,setXlLoading]=useState(false); const [xlFileName,setXlFileName]=useState("");

  /* ── Attendance ── */
  const [aRoll,setARoll]=useState(""); const [aStud,setAStud]=useState(null); const [aErr,setAErr]=useState("");
  const [aSem,setASem]=useState(""); const [aPres,setAPres]=useState(""); const [aTotal,setATotal]=useState("");
  const [aMsg,setAMsg]=useState(""); const [aSemFilter,setASemFilter]=useState("All");

  /* ── Efficiency ── */
  const [eRoll,setERoll]=useState(""); const [eStud,setEStud]=useState(null); const [eErr,setEErr]=useState("");
  const [eType,setEType]=useState(""); const [eSkill,setESkill]=useState(""); const [eSkillPts,setESkillPts]=useState("");
  const [eActType,setEActType]=useState(""); const [eActDesc,setEActDesc]=useState(""); const [eActPts,setEActPts]=useState("");
  const [eAchName,setEAchName]=useState(""); const [eAchPts,setEAchPts]=useState("");
  const [eEditId,setEEditId]=useState(null); const [eData,setEData]=useState(null); const [eScore,setEScore]=useState(null);
  const [eMsg,setEMsg]=useState("");

  /* ── Faculty ── */
  const [fName,setFName]=useState(""); const [fEmail,setFEmail]=useState(""); const [fPwd,setFPwd]=useState(""); const [fPhone,setFPhone]=useState("");
  const [fMsg,setFMsg]=useState("");
  const [facResetId,setFacResetId]=useState(null); const [facResetPwd,setFacResetPwd]=useState(""); const [facResetMsg,setFacResetMsg]=useState("");
  const [editingFaculty,setEditingFaculty]=useState(null);

  /* ── Announcements ── */
  const [annTitle,setAnnTitle]=useState(""); const [annMsg,setAnnMsg]=useState("");
  const [repTxt,setRepTxt]=useState({}); const [listen,setListen]=useState(null);

  /* ── Password ── */
  const [curPwd,setCurPwd]=useState(""); const [newPwd,setNewPwd]=useState(""); const [pwdMsg,setPwdMsg]=useState("");
  const [resetRoll,setResetRoll]=useState(""); const [resetStud,setResetStud]=useState(null); const [resetErr,setResetErr]=useState("");
  const [resetPwd,setResetPwd]=useState(""); const [resetMsg,setResetMsg]=useState("");

  /* ── Bulk students ── */
  const [bulkRows,setBulkRows]=useState([]); const [bulkMsg,setBulkMsg]=useState(""); const [bulkLoading,setBulkLoading]=useState(false); const [bulkFileName,setBulkFileName]=useState("");

  /* ── Sort states ── */
  const studSort=useSortState(); const attSort=useSortState();
  const facSort=useSortState();  const subSort=useSortState();  const effSort=useSortState();

  /* ── Pagination ── */
  const studPag = usePagination(students, 25);
  const subPag  = usePagination(subjects.filter(s=>(s.semester||"Sem 1")===semTab), 25);
  const attPag  = usePagination(attendance.filter(a=>aSemFilter==="All"||a.semester===aSemFilter), 25);
  const effPag  = usePagination(allEff, 25);
  const facPag  = usePagination(faculty, 25);

  /* ── Init ── */
  useEffect(()=>{ if (!localStorage.getItem("token")){navigate("/");return;} loadAll(); },[]);
  useEffect(()=>{ if (eStud){loadEData(eStud.id);loadEScore(eStud.id);} },[eStud]);

  const doFetch = useCallback(async(path,setter)=>{
    try{
      const r=await fetch(`https://slea-backend.onrender.com/${path}`,{headers:getAuth()});
      if (!r.ok) return;
      const d=await r.json();
      setter(Array.isArray(d)?d:[]);
    }catch{}
  },[]);

  const loadAll = async()=>{
    setLoading(true);
    await Promise.all([
      doFetch("students",setStudents),doFetch("subjects",setSubjects),
      doFetch("all-marks",setMarks),doFetch("attendance-list",setAttendance),
      doFetch("admin/faculty",setFaculty),loadAnn(),loadAllEff(),
    ]);
    setLoading(false);
  };
  const loadAnn = async()=>{
    try{
      const r=await fetch("https://slea-backend.onrender.com/announcements",{headers:getAuth()});
      if (!r.ok) return;
      const list=await r.json();
      setAnnouncements(Array.isArray(list)?list:[]);
      (Array.isArray(list)?list:[]).forEach(a=>loadReplies(a.id));
    }catch{}
  };
  const loadReplies = async id=>{
    try{
      const r=await fetch(`https://slea-backend.onrender.com/announcement/${id}/replies`,{headers:getAuth()});
      const d=await r.json();
      setReplies(p=>({...p,[id]:Array.isArray(d)?d:[]}));
    }catch{}
  };
  const loadAllEff = async()=>{
    try{ const r=await fetch("https://slea-backend.onrender.com/admin/all-efficiency",{headers:getAuth()}); if(!r.ok)return; setAllEff(await r.json()); }catch{}
  };
  const loadEData = async sid=>{
    try{ const r=await fetch(`https://slea-backend.onrender.com/admin/student-efficiency-data/${sid}`,{headers:getAuth()}); if(!r.ok)return; setEData(await r.json()); }catch{}
  };
  const loadEScore = async sid=>{
    try{ const r=await fetch(`https://slea-backend.onrender.com/efficiency/${sid}`,{headers:getAuth()}); if(!r.ok)return; setEScore(await r.json()); }catch{}
  };

  /* ── Helpers ── */
  const pickStud=(s,setS,setE,setR)=>{setS(s);setE("");setR(s.rollno);};
  const rollChange=(v,setR,setS,setE)=>{
    setR(v);
    if (!v.trim()){setS(null);setE("");return;}
    const m=students.find(s=>s.rollno.toLowerCase()===v.trim().toLowerCase());
    if (m){setS(m);setE("");}else setS(null);
  };

  /* ── Students ── */
  const addStudent = async()=>{
    if (!sName||!sRoll||!sEmail||!sPwd){setSMsg("❌ Fill all required fields");return;}
    if (sPhone&&!/^[6-9]\d{9}$/.test(sPhone)){setSMsg("❌ Invalid phone number");return;}
    const r=await fetch("https://slea-backend.onrender.com/add-student",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({name:sName,rollno:sRoll,email:sEmail,password:sPwd,phone:sPhone||undefined})});
    const d=await r.json();
    if (!r.ok){setSMsg(`❌ ${d.message}`);return;}
    setSMsg("✅ Student added");setSName("");setSRoll("");setSEmail("");setSPwd("");setSPhone("");
    doFetch("students",setStudents);
  };
  const updateStudent = async(id,updates)=>{
    const r=await fetch(`https://slea-backend.onrender.com/admin/student/${id}`,{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify(updates)});
    const d=await r.json();
    if (!r.ok){setSMsg(`❌ ${d.message}`);return;}
    setSMsg("✅ Student updated");setEditStudent(null);doFetch("students",setStudents);
  };
  const delStudent = async id=>{
    if (!window.confirm("Delete this student and all their data?"))return;
    await fetch(`https://slea-backend.onrender.com/student/${id}`,{method:"DELETE",headers:getAuth()});
    doFetch("students",setStudents);doFetch("all-marks",setMarks);loadAllEff();
  };

  /* ── Subjects ── */
  const addSubject = async()=>{
    if (!subName||!subCred){alert("Fill subject name and credits");return;}
    const r=await fetch("https://slea-backend.onrender.com/add-subject",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({subject_name:subName,credits:Number(subCred),semester:subSem})});
    const d=await r.json();if(!r.ok){alert(d.message);return;}
    setSubName("");setSubCred("");doFetch("subjects",setSubjects);
  };
  const delSubject = async id=>{
    if (!window.confirm("Delete subject and linked marks?"))return;
    await fetch(`https://slea-backend.onrender.com/subject/${id}`,{method:"DELETE",headers:getAuth()});
    doFetch("subjects",setSubjects);doFetch("all-marks",setMarks);
  };

  /* ── Marks: subject-wise inline entry ── */
  const selectedSubject = subjects.find(s=>String(s.id)===String(selectedSubjectId));

  // students who have marks for selected subject+semester
  const studentsWithMarks = selectedSubject
    ? marks.filter(m=>String(m.subject_id)===String(selectedSubjectId)&&m.semester===selectedSemForMarks)
    : [];
  const studentsWithMarksIds = new Set(studentsWithMarks.map(m=>String(m.student_id)));
  const studentsWithoutMarks = selectedSubject
    ? students.filter(s=>!studentsWithMarksIds.has(String(s.id)))
    : [];

  const saveInlineMark = async(studentId)=>{
    const val = inlineMarks[studentId];
    const m = Number(val);
    if (!val||isNaN(m)||m<0||m>100){setMarksMsg("❌ Enter valid marks 0–100");return;}
    setInlineSaving(p=>({...p,[studentId]:true}));
    const r=await fetch("https://slea-backend.onrender.com/add-marks",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({student_id:studentId,subject_id:Number(selectedSubjectId),marks_scored:m,semester:selectedSemForMarks})});
    const d=await r.json();
    setInlineSaving(p=>({...p,[studentId]:false}));
    if (!r.ok){setMarksMsg(`❌ ${d.message}`);return;}
    setMarksMsg(`✅ Marks saved — Grade: ${d.grade}`);
    setInlineMarks(p=>({...p,[studentId]:""}));
    doFetch("all-marks",setMarks);loadAllEff();
  };

  const saveEditMark = async(markId, newMarks)=>{
    const r=await fetch(`https://slea-backend.onrender.com/mark/${markId}`,{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({marks_scored:newMarks})});
    const d=await r.json();
    if (!r.ok){setMarksMsg(`❌ ${d.message}`);return;}
    setMarksMsg("✅ Marks updated");setEditingMark(null);
    doFetch("all-marks",setMarks);loadAllEff();
  };

  /* ── Marks excel (kept as alternate mode) ── */
  const parseExcel = async file=>{
    setXlMsg("");setXlFileName(file.name);
    const ext=file.name.split(".").pop().toLowerCase();
    try{
      let raw=[];
      if (ext==="csv"){
        const text=await file.text();
        raw=text.split(/\r?\n/).map(l=>l.split(",").map(c=>c.trim().replace(/^"|"$/g,""))).filter(r=>r.some(c=>c!==""));
      }else{
        const XLSX=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
        const buf=await file.arrayBuffer();
        const wb=XLSX.read(buf,{type:"array"});
        raw=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""});
      }
      const data=(raw[0]?.[0]?.toString().toLowerCase().includes("roll")?raw.slice(1):raw).filter(r=>r.some(c=>c!==""));
      setXlRows(data.map((r,i)=>({row:i+1,roll_no:String(r[0]??"").trim(),semester:String(r[1]??"").trim(),subject:String(r[2]??"").trim(),marks:String(r[3]??"").trim(),status:"pending",message:""})));
    }catch{setXlMsg("❌ Could not read file");}
  };

  const submitExcel = async()=>{
    if (!xlRows.length) return;
    setXlLoading(true);setXlMsg("");
    const updated=[...xlRows];
    for (let i=0;i<updated.length;i++){
      const row=updated[i];if(row.status==="ok")continue;
      const m=Number(row.marks);
      if (!row.roll_no||!row.semester||!row.subject){updated[i]={...row,status:"error",message:"Missing fields"};continue;}
      if (isNaN(m)||m<0||m>100){updated[i]={...row,status:"error",message:"Marks 0–100"};continue;}
      const norm=s=>String(s??"").replace(/\s/g,"").toUpperCase();
      const stud=students.find(s=>norm(s.rollno)===norm(row.roll_no));
      if (!stud){updated[i]={...row,status:"error",message:`Roll "${row.roll_no}" not found`};continue;}
      const cn=s=>s.trim().toLowerCase().replace(/[^a-z0-9 ]/g,"");
      let subj=subjects.find(s=>s.subject_name.toLowerCase()===row.subject.toLowerCase());
      if (!subj) subj=subjects.find(s=>cn(s.subject_name)===cn(row.subject));
      if (!subj) subj=subjects.find(s=>cn(s.subject_name).includes(cn(row.subject))||cn(row.subject).includes(cn(s.subject_name)));
      if (!subj){updated[i]={...row,status:"error",message:`Subject "${row.subject}" not found`};continue;}
      try{
        const res=await fetch("https://slea-backend.onrender.com/add-marks",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},
          body:JSON.stringify({student_id:stud.id,subject_id:subj.id,marks_scored:m,semester:row.semester})});
        const dd=await res.json();
        updated[i]=res.ok?{...row,status:"ok",message:`${dd.grade} · ${dd.gradePoints}pts`}:{...row,status:"error",message:dd.message};
      }catch{updated[i]={...row,status:"error",message:"Network error"};}
      setXlRows([...updated]);
    }
    const ok=updated.filter(r=>r.status==="ok").length,err=updated.filter(r=>r.status==="error").length;
    setXlMsg(`✅ ${ok} saved${err?` · ❌ ${err} failed`:""}`);
    setXlLoading(false);doFetch("all-marks",setMarks);loadAllEff();
  };

  /* ── Faculty ── */
  const addFaculty = async()=>{
    if (!fName||!fEmail||!fPwd){setFMsg("❌ Fill all required fields");return;}
    const r=await fetch("https://slea-backend.onrender.com/admin/add-faculty",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({name:fName,email:fEmail,password:fPwd,phone:fPhone||undefined})});
    const d=await r.json();if(!r.ok){setFMsg(`❌ ${d.message}`);return;}
    setFMsg("✅ Faculty added");setFName("");setFEmail("");setFPwd("");setFPhone("");
    doFetch("admin/faculty",setFaculty);
  };
  const updateFaculty = async(id,updates)=>{
    const r=await fetch(`https://slea-backend.onrender.com/admin/faculty/${id}`,{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify(updates)});
    const d=await r.json();
    if (!r.ok){setFMsg(`❌ ${d.message}`);return;}
    setFMsg("✅ Faculty updated");setEditingFaculty(null);doFetch("admin/faculty",setFaculty);
  };
  const toggleFacultyStatus = async(f)=>{
    const newActive = f.is_active===0 ? 1 : 0;
    const r=await fetch(`https://slea-backend.onrender.com/admin/faculty/${f.id}`,{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({name:f.name,email:f.email,phone:f.phone||"",is_active:newActive})});
    if (!r.ok) return;
    setFMsg(`✅ Faculty marked ${newActive===1?"Active":"Inactive"}`);
    doFetch("admin/faculty",setFaculty);
  };
  const resetFacultyPassword = async()=>{
    if (!facResetId||!facResetPwd){setFacResetMsg("❌ Select faculty and enter password");return;}
    if (facResetPwd.length<4){setFacResetMsg("❌ Min 4 chars");return;}
    const r=await fetch("https://slea-backend.onrender.com/admin/reset-faculty-password",{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({faculty_id:facResetId,new_password:facResetPwd})});
    const d=await r.json();
    if (!r.ok){setFacResetMsg(`❌ ${d.message}`);return;}
    setFacResetMsg("✅ Password reset");setFacResetId(null);setFacResetPwd("");
  };

  /* ── Bulk students ── */
  const parseBulkExcel = async file=>{
    setBulkMsg("");setBulkFileName(file.name);
    const ext=file.name.split(".").pop().toLowerCase();
    try{
      let raw=[];
      if (ext==="csv"){const text=await file.text();raw=text.split(/\r?\n/).map(l=>l.split(",").map(c=>c.trim().replace(/^"|"$/g,"")));}
      else{
        const XLSX=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
        const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:"array"});
        raw=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""});
      }
      const hdr=String(raw[0]?.[0]||"").toLowerCase();
      const data=(hdr.includes("name")||hdr.includes("s.no")?raw.slice(1):raw).filter(r=>r.some(c=>c!==""));
      setBulkRows(data.map((r,i)=>({row:i+1,name:String(r[1]??r[0]??"").trim(),rollno:String(r[2]??r[1]??"").trim(),email:String(r[3]??r[2]??"").trim(),password:String(r[4]??r[3]??"").trim(),status:"pending",message:""})));
    }catch{setBulkMsg("❌ Could not read file");}
  };
  const submitBulk = async()=>{
    if (!bulkRows.length) return;
    setBulkLoading(true);setBulkMsg("");
    const payload=bulkRows.filter(r=>r.status!=="ok").map(r=>({name:r.name,rollno:r.rollno,email:r.email,password:r.password}));
    try{
      const r=await fetch("https://slea-backend.onrender.com/admin/bulk-add-students",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({students:payload})});
      const d=await r.json();
      const updated=[...bulkRows];
      (d.results||[]).forEach((res,i)=>{updated[i]={...updated[i],status:res.status,message:res.message};});
      setBulkRows(updated);
      const ok=updated.filter(r=>r.status==="ok").length,err=updated.filter(r=>r.status==="error").length;
      setBulkMsg(`✅ ${ok} added${err?` · ❌ ${err} failed`:""}`);
      doFetch("students",setStudents);
    }catch{setBulkMsg("❌ Network error");}
    setBulkLoading(false);
  };

  /* ── Attendance ── */
  const addAtt = async()=>{
    if (!aStud||!aSem||!aPres||!aTotal){setAMsg("❌ Fill all fields");return;}
    const p=Number(aPres),t=Number(aTotal);
    if (p>t){setAMsg("❌ Present > Total");return;}
    const r=await fetch("https://slea-backend.onrender.com/add-attendance",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify({student_id:aStud.id,semester:aSem,present_days:p,total_days:t})});
    const d=await r.json();if(!r.ok){setAMsg(`❌ ${d.message}`);return;}
    setAMsg(`✅ Saved — ${((p/t)*100).toFixed(1)}%`);
    setARoll("");setAStud(null);setASem("");setAPres("");setATotal("");
    doFetch("attendance-list",setAttendance);
  };

  /* ── Efficiency ── */
  const resetEForm=()=>{setEType("");setESkill("");setESkillPts("");setEActType("");setEActDesc("");setEActPts("");setEAchName("");setEAchPts("");setEEditId(null);};
  const setSkill=async()=>{
    if (!eStud||!eSkill||!eSkillPts){setEMsg("❌ Enter skill and points");return;}
    const r=await fetch("https://slea-backend.onrender.com/admin/student-skill",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:eStud.id,skill_level:eSkill,skill_score:Number(eSkillPts)})});
    const d=await r.json();if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg("✅ Skill saved");resetEForm();loadEData(eStud.id);loadEScore(eStud.id);loadAllEff();
  };
  const addAct=async()=>{
    if (!eStud||!eActType){setEMsg("❌ Select activity type");return;}
    const pts=Number(eActPts)||ACT_PTS[eActType]||10;
    const url=eEditId?`https://slea-backend.onrender.com/admin/student-activity/${eEditId}`:"https://slea-backend.onrender.com/admin/student-activity";
    const r=await fetch(url,{method:eEditId?"PUT":"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify(eEditId?{activity_type:eActType,description:eActDesc,points:pts}:{student_id:eStud.id,activity_type:eActType,description:eActDesc,points:pts})});
    const d=await r.json();if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg(eEditId?"✅ Activity updated":"✅ Activity added");resetEForm();loadEData(eStud.id);loadEScore(eStud.id);loadAllEff();
  };
  const delAct=async id=>{await fetch(`https://slea-backend.onrender.com/admin/student-activity/${id}`,{method:"DELETE",headers:getAuth()});loadEData(eStud.id);loadEScore(eStud.id);loadAllEff();};
  const addAch=async()=>{
    if (!eStud||!eAchName||!eAchPts){setEMsg("❌ Fill name and points");return;}
    const url=eEditId?`https://slea-backend.onrender.com/admin/student-achievement/${eEditId}`:"https://slea-backend.onrender.com/admin/student-achievement";
    const r=await fetch(url,{method:eEditId?"PUT":"POST",headers:{"Content-Type":"application/json",...getAuth()},
      body:JSON.stringify(eEditId?{achievement_name:eAchName,points:Number(eAchPts)}:{student_id:eStud.id,achievement_name:eAchName,points:Number(eAchPts)})});
    const d=await r.json();if(!r.ok){setEMsg(`❌ ${d.message}`);return;}
    setEMsg(eEditId?"✅ Achievement updated":"✅ Achievement added");resetEForm();loadEData(eStud.id);loadEScore(eStud.id);loadAllEff();
  };
  const delAch=async id=>{await fetch(`https://slea-backend.onrender.com/admin/student-achievement/${id}`,{method:"DELETE",headers:getAuth()});loadEData(eStud.id);loadEScore(eStud.id);loadAllEff();};

  /* ── Announcements ── */
  const postAnn=async()=>{
    if (!annTitle||!annMsg){alert("Title and message required");return;}
    await fetch("https://slea-backend.onrender.com/admin/announcement",{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({title:annTitle,message:annMsg})});
    setAnnTitle("");setAnnMsg("");loadAnn();
  };
  const delAnn=async id=>{
    if (!window.confirm("Delete?"))return;
    await fetch(`https://slea-backend.onrender.com/superadmin/announcement/${id}`,{method:"DELETE",headers:getAuth()});loadAnn();
  };
  const startVoice=annId=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR){alert("Use Chrome for voice");return;}
    const rec=new SR();rec.lang="en-IN";rec.interimResults=false;setListen(annId);
    rec.onresult=e=>{setRepTxt(p=>({...p,[annId]:e.results[0][0].transcript}));setListen(null);};
    rec.onerror=()=>setListen(null);rec.onend=()=>setListen(null);rec.start();
  };
  const sendReply=async(annId,isVoice=false)=>{
    const t=(repTxt[annId]||"").trim();if(!t)return;
    await fetch(`https://slea-backend.onrender.com/announcement/${annId}/reply`,{method:"POST",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({reply_text:t,is_voice:isVoice})});
    setRepTxt(p=>({...p,[annId]:""}));loadReplies(annId);
  };

  /* ── Password ── */
  const changePassword=async()=>{
    if (!curPwd||!newPwd){setPwdMsg("❌ Fill both fields");return;}
    const r=await fetch("https://slea-backend.onrender.com/change-password",{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({current_password:curPwd,new_password:newPwd})});
    const d=await r.json();if(!r.ok){setPwdMsg(`❌ ${d.message}`);return;}
    setPwdMsg("✅ Password changed!");setCurPwd("");setNewPwd("");
  };
  const resetStudentPassword=async()=>{
    if (!resetStud||!resetPwd){setResetMsg("❌ Select student and enter password");return;}
    if (resetPwd.length<4){setResetMsg("❌ Min 4 chars");return;}
    const r=await fetch("https://slea-backend.onrender.com/admin/reset-student-password",{method:"PUT",headers:{"Content-Type":"application/json",...getAuth()},body:JSON.stringify({student_id:resetStud.id,new_password:resetPwd})});
    const d=await r.json();if(!r.ok){setResetMsg(`❌ ${d.message}`);return;}
    setResetMsg("✅ Password reset");setResetRoll("");setResetStud(null);setResetPwd("");
  };

  const logout=()=>{localStorage.clear();navigate("/");};

  /* ── Computed ── */
  const attEff=aPres&&aTotal&&Number(aTotal)>0?((Number(aPres)/Number(aTotal))*100).toFixed(1):null;
  const bandCounts=allEff.reduce((acc,e)=>{acc[e.band]=(acc[e.band]||0)+1;return acc;},{});
  const avgScore=allEff.length?(allEff.reduce((s,e)=>s+e.finalScore,0)/allEff.length).toFixed(1):"—";

  if (loading) return <Typography sx={{p:4}}>Loading…</Typography>;

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html,body,#root{height:auto!important;overflow-y:auto!important;overflow-x:hidden;font-family:'Inter','Segoe UI',sans-serif!important}
        *{font-family:'Inter','Segoe UI',sans-serif}
      `}</style>

      <Box sx={{display:"flex",alignItems:"flex-start"}}>
        <CssBaseline/>

        {/* Modals */}
        {editStudent  && <EditStudentModal student={editStudent}   onClose={()=>setEditStudent(null)}  onSave={updateStudent}/>}
        {editingMark  && <EditMarksModal   mark={editingMark}      onClose={()=>setEditingMark(null)}  onSave={saveEditMark}/>}
        {editingFaculty && <EditFacultyModal faculty={editingFaculty} onClose={()=>setEditingFaculty(null)} onSave={updateFaculty}/>}

        {/* ── AppBar ── */}
        <AppBar position="fixed" sx={{width:`calc(100% - ${drawerWidth}px)`,ml:`${drawerWidth}px`,background:"linear-gradient(90deg,#1e3c72,#2a5298)"}}>
          <Toolbar>
            <Typography variant="h6" noWrap sx={{fontWeight:700}}>{tab}</Typography>
            {userDept&&(
              <span style={{marginLeft:"12px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",
                padding:"3px 12px",borderRadius:"999px",fontSize:"12px",fontWeight:600,letterSpacing:"0.3px"}}>
                {userDept}
              </span>
            )}
          </Toolbar>
        </AppBar>

        {/* ── Drawer ── */}
        <Drawer variant="permanent" anchor="left" sx={{width:drawerWidth,flexShrink:0,
          "& .MuiDrawer-paper":{width:drawerWidth,boxSizing:"border-box",
            background:"linear-gradient(180deg,#1e3c72,#2a5298)",color:"#fff",
            display:"flex",flexDirection:"column"}}}>
          <Toolbar sx={{justifyContent:"center",flexDirection:"column",py:1.5}}>
            <Typography variant="h6" sx={{fontWeight:700,color:"#fff",lineHeight:1.2}}>SLEA Admin</Typography>
            {userDept&&<Typography sx={{fontSize:"11px",color:"rgba(255,255,255,0.65)",fontWeight:500,letterSpacing:"0.5px",textTransform:"uppercase",mt:"2px"}}>{userDept} Dept</Typography>}
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

        {/* ── Main ── */}
        <Box component="main" sx={{flexGrow:1,bgcolor:"#f4f6f9",minHeight:"100vh",p:4,boxSizing:"border-box"}}>
          <Toolbar/>

          {/* ══════════ DASHBOARD ══════════ */}
          {tab==="Dashboard" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Admin Overview</Typography>

              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",mb:3}}>
                {[
                  {label:"Total Students",value:students.length,color:"#2563eb"},
                  {label:"Total Subjects",value:subjects.length,color:"#16a34a"},
                  {label:"Faculty Members",value:faculty.length,color:"#7c3aed"},
                  {label:"Avg Efficiency",value:avgScore,color:"#d97706"},
                ].map(({label,value,color})=>(
                  <Box key={label} sx={{flex:"1 1 160px",...S.card,textAlign:"center",borderTop:`4px solid ${color}`}}>
                    <Typography sx={{fontSize:"14px",color:"#64748b",mb:1}}>{label}</Typography>
                    <Typography sx={{fontSize:"32px",fontWeight:700,color}}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",mb:4}}>
                {[
                  {label:"Marks Entries",value:marks.length,color:"#0891b2"},
                  {label:"Attendance Records",value:attendance.length,color:"#db2777"},
                  {label:"Announcements",value:announcements.length,color:"#f59e0b"},
                ].map(({label,value,color})=>(
                  <Box key={label} sx={{flex:"1 1 160px",...S.card,textAlign:"center",borderTop:`4px solid ${color}`}}>
                    <Typography sx={{fontSize:"14px",color:"#64748b",mb:1}}>{label}</Typography>
                    <Typography sx={{fontSize:"32px",fontWeight:700,color}}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",mb:4}}>
                {/* Performance bands */}
                <Box sx={{flex:"1 1 340px",...S.card}}>
                  <Typography variant="h6" sx={{fontWeight:700,mb:2}}>Student Performance Bands</Typography>
                  {allEff.length===0
                    ?<Typography sx={{color:"#94a3b8",fontSize:"14px"}}>No efficiency data yet.</Typography>
                    :(
                      <Box sx={{display:"flex",flexDirection:"column",gap:1.5}}>
                        {[
                          {band:"Excellent",color:"#16a34a",bg:"#f0fdf4"},
                          {band:"Good",color:"#2563eb",bg:"#eff6ff"},
                          {band:"Needs Improvement",color:"#d97706",bg:"#fffbeb"},
                          {band:"Weak",color:"#dc2626",bg:"#fef2f2"},
                        ].map(({band,color,bg})=>{
                          const count=bandCounts[band]||0;
                          const pct=allEff.length?Math.round((count/allEff.length)*100):0;
                          return (
                            <Box key={band} sx={{background:bg,borderRadius:"10px",p:"10px 14px"}}>
                              <Box sx={{display:"flex",justifyContent:"space-between",mb:0.8}}>
                                <Typography sx={{fontWeight:700,fontSize:"13px",color}}>{band}</Typography>
                                <Typography sx={{fontWeight:800,color,fontSize:"15px"}}>{count} <span style={{fontWeight:400,color:"#94a3b8",fontSize:"12px"}}>students</span></Typography>
                              </Box>
                              <Box sx={{height:"6px",background:"#e2e8f0",borderRadius:"3px",overflow:"hidden"}}>
                                <Box sx={{height:"100%",width:`${pct}%`,background:color,borderRadius:"3px"}}/>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )
                  }
                </Box>

                {/* Subjects by semester */}
                <Box sx={{flex:"1 1 300px",...S.card}}>
                  <Typography variant="h6" sx={{fontWeight:700,mb:2}}>Subjects by Semester</Typography>
                  <Box sx={{display:"flex",flexWrap:"wrap",gap:1}}>
                    {SEMESTERS.map(sem=>{
                      const cnt=subjects.filter(s=>s.semester===sem).length;
                      if (!cnt) return null;
                      return (
                        <Box key={sem} sx={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"10px",px:2,py:1,textAlign:"center",minWidth:80}}>
                          <Typography sx={{fontSize:"11px",color:"#2563eb",fontWeight:700,letterSpacing:"0.4px"}}>{sem}</Typography>
                          <Typography sx={{fontSize:"22px",fontWeight:800,color:"#1e40af"}}>{cnt}</Typography>
                          <Typography sx={{fontSize:"10px",color:"#94a3b8"}}>subjects</Typography>
                        </Box>
                      );
                    })}
                    {subjects.length===0&&<Typography sx={{color:"#94a3b8",fontSize:"14px"}}>No subjects yet.</Typography>}
                  </Box>
                </Box>
              </Box>

              {/* Top performers */}
              {allEff.length>0&&(
                <Box sx={{...S.card}}>
                  <Typography variant="h6" sx={{fontWeight:700,mb:2}}>Top Performers</Typography>
                  <Box sx={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                        <th style={S.th}>#</th><th style={S.th}>Name</th><th style={S.th}>Roll</th>
                        <th style={S.th}>Score</th><th style={S.th}>Band</th><th style={S.th}>Dept Rank</th>
                      </tr></thead>
                      <tbody>
                        {allEff.slice(0,5).map((e,i)=>(
                          <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                            <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                            <td style={{...S.td,fontWeight:600}}>{e.name}</td>
                            <td style={{...S.td,fontFamily:"monospace",fontSize:"12px"}}>{e.rollno}</td>
                            <td style={{...S.td,fontWeight:800,color:bandColor(e.band)}}>{e.finalScore}</td>
                            <td style={S.td}><span style={{background:bandColor(e.band)+"20",color:bandColor(e.band),padding:"3px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{e.band}</span></td>
                            <td style={{...S.td,color:"#64748b"}}>#{e.deptRank}/{e.deptTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* ══════════ STUDENTS ══════════ */}
          {tab==="Students" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Students</Typography>
              <MsgBox msg={sMsg}/>
              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start",mb:4}}>
                <Box sx={{flex:"0 0 320px",...S.card}}>
                  <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,color:"#0f172a"}}>➕ Add Single Student</Typography>
                  <input style={S.inp} placeholder="Full Name "    value={sName}  onChange={e=>setSName(e.target.value)}/>
                  <input style={S.inp} placeholder="Email "        value={sEmail} onChange={e=>setSEmail(e.target.value)}/>
                  <input style={S.inp} placeholder="Roll Number "  value={sRoll}  onChange={e=>setSRoll(e.target.value)}/>
                  <input style={S.inp} placeholder="Phone " value={sPhone} onChange={e=>setSPhone(e.target.value)}/>
                  <input style={S.inp} type="password" placeholder="Password" value={sPwd} onChange={e=>setSPwd(e.target.value)}/>
                  <button style={S.btn} onClick={addStudent}>Add Student</button>
                  <button onClick={()=>{const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent("S.No,Name,Roll_No,Mail_ID,Password\n1,Aarav Kumar,7376231ME101,aarav@mail.com,pass123\n");a.download="students_template.csv";a.click();}}
                    style={{width:"100%",marginTop:"8px",padding:"10px",background:"linear-gradient(90deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600}}>
                    Download Template
                  </button>
                </Box>

                <Box sx={{flex:"1 1 360px",...S.card,border:"2px dashed #cbd5e1"}}>
                  <Typography sx={{fontWeight:700,fontSize:"15px",mb:1,color:"#0f172a"}}>Upload  Excel / CSV</Typography>
                  <Typography sx={{fontSize:"12px",color:"#64748b",mb:2}}><strong>S.No · Name · Roll_No · Mail_ID · Password</strong></Typography>
                  <label style={{display:"block",cursor:"pointer",marginBottom:"10px"}}>
                    <Box sx={{border:"2px dashed #94a3b8",borderRadius:"10px",p:"16px",textAlign:"center",background:"#f8fafc"}}>
                      <Typography sx={{fontSize:"28px",mb:0.5}}>👥</Typography>
                      <Typography sx={{fontWeight:600,fontSize:"13px",color:"#1e293b",mb:0.3}}>{bulkFileName||"Click to choose file"}</Typography>
                      <Typography sx={{fontSize:"11px",color:"#64748b"}}>{bulkFileName?"File selected ✓":".csv · .xlsx · .xls"}</Typography>
                    </Box>
                    <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])parseBulkExcel(e.target.files[0]);e.target.value="";}}/>
                  </label>
                  {bulkRows.length>0&&<button style={{...S.btn,opacity:bulkLoading?0.6:1,marginBottom:"8px"}} disabled={bulkLoading} onClick={submitBulk}>{bulkLoading?"⏳ Uploading...":`⬆️ Add ${bulkRows.filter(r=>r.status!=="ok").length} Students`}</button>}
                  {bulkRows.length>0&&!bulkLoading&&<button onClick={()=>{setBulkRows([]);setBulkMsg("");setBulkFileName("");}} style={{width:"100%",padding:"9px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,color:"#64748b"}}>🗑 Clear</button>}
                  {bulkMsg&&<Box sx={{mt:1.5,p:"10px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:600,background:bulkMsg.startsWith("✅")?"#f0fdf4":"#fef2f2",border:bulkMsg.startsWith("✅")?"1px solid #86efac":"1px solid #fca5a5",color:bulkMsg.startsWith("✅")?"#16a34a":"#dc2626"}}>{bulkMsg}</Box>}
                  {bulkRows.length>0&&(
                    <Box sx={{mt:2,...S.card,p:0,overflow:"hidden",border:"1px solid #e2e8f0"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                        <thead><tr style={{background:"#1e293b"}}>{["#","Name","Roll No","Status"].map(h=><th key={h} style={{...S.th,color:"#94a3b8",padding:"8px 10px",fontSize:"10px"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {bulkRows.map((r,i)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:r.status==="ok"?"#f0fdf4":r.status==="error"?"#fef2f2":"transparent"}}>
                              <td style={{...S.td,padding:"7px 10px",color:"#94a3b8"}}>{r.row}</td>
                              <td style={{...S.td,padding:"7px 10px",fontWeight:500}}>{r.name||"—"}</td>
                              <td style={{...S.td,padding:"7px 10px",fontFamily:"monospace",fontSize:"11px"}}>{r.rollno||"—"}</td>
                              <td style={{...S.td,padding:"7px 10px"}}>
                                {r.status==="ok"&&<span style={{color:"#16a34a",fontWeight:700,fontSize:"11px"}}>✅ Added</span>}
                                {r.status==="pending"&&<span style={{color:"#94a3b8",fontSize:"11px"}}>⏳</span>}
                                {r.status==="error"&&<span style={{color:"#dc2626",fontWeight:600,fontSize:"11px"}}>❌ {r.message}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </Box>
              </Box>

              <Typography variant="h6" sx={{fontWeight:700,mb:2}}>All Students ({students.length})</Typography>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    <th style={S.th}>#</th>
                    <SortTh label="Name"    col="name"   sortCol={studSort.sortCol} sortDir={studSort.sortDir} onToggle={studSort.toggle}/>
                    <SortTh label="Roll No" col="rollno" sortCol={studSort.sortCol} sortDir={studSort.sortDir} onToggle={studSort.toggle}/>
                    <SortTh label="Email"   col="email"  sortCol={studSort.sortCol} sortDir={studSort.sortDir} onToggle={studSort.toggle}/>
                    <th style={S.th}>Phone</th><th style={S.th}>Status</th><th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {studSort.sort(studPag.slice,(r,c)=>r[c]).map((s,i)=>(
                      <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{...S.td,color:"#94a3b8"}}>{(studPag.page-1)*studPag.size+i+1}</td>
                        <td style={{...S.td,fontWeight:500}}>{s.name}</td>
                        <td style={{...S.td,fontFamily:"monospace"}}>{s.rollno}</td>
                        <td style={S.td}>{s.email}</td>
                        <td style={S.td}>{s.phone?<a href={`tel:${s.phone}`} style={{color:"#2563eb",textDecoration:"none",fontWeight:500}}>📞 {s.phone}</a>:<span style={{color:"#94a3b8"}}>—</span>}</td>
                        <td style={S.td}><span style={{background:s.is_active!==0?"#dcfce7":"#fee2e2",color:s.is_active!==0?"#16a34a":"#dc2626",padding:"3px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{s.is_active!==0?"● Active":"○ Inactive"}</span></td>
                        <td style={S.td}>
                          <div style={{display:"flex",gap:"4px"}}>
                            <IconButton size="small" sx={{color:"#2563eb"}} onClick={()=>setEditStudent(s)} title="Edit"><EditIcon fontSize="small"/></IconButton>
                            <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delStudent(s.id)} title="Delete"><DeleteIcon fontSize="small"/></IconButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length===0&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"20px"}}>No students yet</td></tr>}
                  </tbody>
                </table>
                <PaginationBar {...studPag}/>
              </Box>
            </Box>
          )}

          {/* ══════════ SUBJECTS ══════════ */}
          {tab==="Subjects" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Subjects</Typography>
              <Box sx={{...S.card,maxWidth:480,mb:4}}>
                <input style={S.inp} placeholder="Subject Name" value={subName} onChange={e=>setSubName(e.target.value)}/>
                <input style={S.inp} type="number" placeholder="Credits (1-5)" value={subCred} onChange={e=>setSubCred(e.target.value)}/>
                <select style={S.inp} value={subSem} onChange={e=>setSubSem(e.target.value)}>
                  {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button style={S.btn} onClick={addSubject}>Add Subject</button>
              </Box>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
                {SEMESTERS.map(sem=>{
                  const cnt=subjects.filter(s=>(s.semester||"Sem 1")===sem).length;
                  return (
                    <button key={sem} onClick={()=>setSemTab(sem)} style={{padding:"8px 18px",borderRadius:"20px",border:"none",cursor:"pointer",fontWeight:600,fontSize:"13px",transition:"all 0.2s",background:semTab===sem?"linear-gradient(90deg,#1e3c72,#2a5298)":"#fff",color:semTab===sem?"#fff":"#475569",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                      {sem} <span style={{opacity:0.75,fontSize:"11px"}}>({cnt})</span>
                    </button>
                  );
                })}
              </div>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    <th style={S.th}>#</th>
                    <SortTh label="Subject"  col="subject_name" sortCol={subSort.sortCol} sortDir={subSort.sortDir} onToggle={subSort.toggle}/>
                    <SortTh label="Semester" col="semester"     sortCol={subSort.sortCol} sortDir={subSort.sortDir} onToggle={subSort.toggle}/>
                    <SortTh label="Credits"  col="credits"      sortCol={subSort.sortCol} sortDir={subSort.sortDir} onToggle={subSort.toggle}/>
                    <th style={S.th}>Department</th><th style={S.th}>Action</th>
                  </tr></thead>
                  <tbody>
                    {subSort.sort(subPag.slice,(r,c)=>r[c]).map((s,i)=>(
                      <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{...S.td,color:"#94a3b8"}}>{(subPag.page-1)*subPag.size+i+1}</td>
                        <td style={{...S.td,fontWeight:500}}>{s.subject_name}</td>
                        <td style={S.td}><span style={{background:"#f1f5f9",padding:"2px 8px",borderRadius:"20px",fontSize:"12px"}}>{s.semester||"Sem 1"}</span></td>
                        <td style={S.td}>{s.credits} cr</td>
                        <td style={S.td}><span style={{background:"#2563eb",color:"#fff",padding:"2px 10px",borderRadius:"20px",fontSize:"12px"}}>{s.department}</span></td>
                        <td style={S.td}><IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delSubject(s.id)}><DeleteIcon fontSize="small"/></IconButton></td>
                      </tr>
                    ))}
                    {subPag.slice.length===0&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"20px"}}>No subjects for {semTab}</td></tr>}
                  </tbody>
                </table>
                <PaginationBar {...subPag}/>
              </Box>
            </Box>
          )}

          {/* ══════════ MARKS ══════════ */}
          {tab==="Marks" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:1}}>Marks Management</Typography>
              <Typography sx={{color:"#64748b",fontSize:"13px",mb:3}}>Enter marks subject-wise. Edit is allowed; delete is disabled.</Typography>
              <MsgBox msg={marksMsg}/>

              {/* Mode toggle */}
              <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
                {[{v:"subjectwise",lbl:" Subject-wise Entry"},{v:"upload",lbl:"Upload (CSV/Excel)"}].map(m=>(
                  <button key={m.v} onClick={()=>setMarksMode(m.v)} style={{padding:"9px 20px",borderRadius:"9px",cursor:"pointer",fontWeight:600,fontSize:"13px",border:"none",
                    background:marksMode===m.v?"linear-gradient(90deg,#1e3c72,#2a5298)":"#fff",
                    color:marksMode===m.v?"#fff":"#475569",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                    {m.lbl}
                  </button>
                ))}
              </div>

              {/* ── Subject-wise entry mode ── */}
              {marksMode==="subjectwise" && (
                <Box>
                  {/* Subject + Semester selectors */}
                  <Box sx={{...S.card,mb:4,maxWidth:640}}>
                    <Typography sx={{fontWeight:700,fontSize:"15px",mb:2}}>Select Subject & Semester</Typography>
                    <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
                      <div style={{flex:"1 1 260px"}}>
                        <Typography sx={{fontSize:"12px",fontWeight:600,color:"#64748b",mb:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Semester</Typography>
                        <select style={S.inp} value={selectedSemForMarks} onChange={e=>{setSelectedSemForMarks(e.target.value);setSelectedSubjectId("");}}>
                          {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{flex:"1 1 260px"}}>
                        <Typography sx={{fontSize:"12px",fontWeight:600,color:"#64748b",mb:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Subject</Typography>
                        <select style={S.inp} value={selectedSubjectId} onChange={e=>setSelectedSubjectId(e.target.value)}>
                          <option value="">— Select Subject —</option>
                          {subjects.filter(s=>s.semester===selectedSemForMarks).map(s=>(
                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {subjects.filter(s=>s.semester===selectedSemForMarks).length===0&&(
                      <Typography sx={{fontSize:"13px",color:"#f59e0b"}}>⚠ No subjects found for {selectedSemForMarks}. Add subjects first.</Typography>
                    )}
                  </Box>

                  {selectedSubject && (
                    <Box>
                      {/* Subject header */}
                      <Box sx={{...S.card,mb:3,borderLeft:"4px solid #2563eb",py:2,px:3,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:2}}>
                        <div>
                          <Typography sx={{fontWeight:800,fontSize:"17px",color:"#1e293b"}}>{selectedSubject.subject_name}</Typography>
                          <Typography sx={{fontSize:"13px",color:"#64748b"}}>{selectedSubject.semester} · {selectedSubject.credits} credits · {selectedSubject.department}</Typography>
                        </div>
                        <div style={{display:"flex",gap:"16px"}}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:"24px",fontWeight:800,color:"#16a34a"}}>{studentsWithMarks.length}</div>
                            <div style={{fontSize:"11px",color:"#64748b"}}>Entered</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:"24px",fontWeight:800,color:"#ef4444"}}>{studentsWithoutMarks.length}</div>
                            <div style={{fontSize:"11px",color:"#64748b"}}>Pending</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontSize:"24px",fontWeight:800,color:"#2563eb"}}>{students.length}</div>
                            <div style={{fontSize:"11px",color:"#64748b"}}>Total</div>
                          </div>
                        </div>
                      </Box>

                      {/* ── List 2: Students WITHOUT marks (enter marks) ── */}
                      {studentsWithoutMarks.length>0&&(
                        <Box sx={{...S.card,mb:4,borderTop:"3px solid #ef4444"}}>
                          <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,color:"#dc2626"}}>
                            ⏳ Marks Not Entered ({studentsWithoutMarks.length} students)
                          </Typography>
                          <Box sx={{overflowX:"auto"}}>
                            <table style={{width:"100%",borderCollapse:"collapse"}}>
                              <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                                <th style={S.th}>#</th>
                                <th style={S.th}>Name</th>
                                <th style={S.th}>Roll No</th>
                                <th style={{...S.th,width:"160px"}}>Enter Marks (0–100)</th>
                                <th style={S.th}>Action</th>
                              </tr></thead>
                              <tbody>
                                {studentsWithoutMarks.map((s,i)=>(
                                  <tr key={s.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                                    <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                                    <td style={{...S.td,fontWeight:600}}>{s.name}</td>
                                    <td style={{...S.td,fontFamily:"monospace",fontSize:"12px"}}>{s.rollno}</td>
                                    <td style={S.td}>
                                      <input
                                        type="number" min={0} max={100}
                                        placeholder="e.g. 85"
                                        value={inlineMarks[s.id]||""}
                                        onChange={e=>setInlineMarks(p=>({...p,[s.id]:e.target.value}))}
                                        onKeyDown={e=>e.key==="Enter"&&saveInlineMark(s.id)}
                                        style={{width:"100px",padding:"7px 10px",fontSize:"13px",borderRadius:"7px",
                                          border:"1.5px solid #e2e8f0",outline:"none",fontFamily:FONT,
                                          background:inlineMarks[s.id]?"#f0f9ff":"#fff"}}
                                      />
                                    </td>
                                    <td style={S.td}>
                                      <button
                                        onClick={()=>saveInlineMark(s.id)}
                                        disabled={!inlineMarks[s.id]||inlineSaving[s.id]}
                                        style={{padding:"7px 16px",background:inlineMarks[s.id]?"linear-gradient(90deg,#16a34a,#15803d)":"#e2e8f0",
                                          color:inlineMarks[s.id]?"#fff":"#94a3b8",border:"none",borderRadius:"7px",
                                          fontWeight:600,fontSize:"12px",cursor:inlineMarks[s.id]?"pointer":"not-allowed",fontFamily:FONT}}>
                                        {inlineSaving[s.id]?"Saving…":"✅ Save"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        </Box>
                      )}

                      {/* ── List 1: Students WITH marks (view + edit) ── */}
                      {studentsWithMarks.length>0&&(
                        <Box sx={{...S.card,mb:4,borderTop:"3px solid #16a34a"}}>
                          <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,color:"#16a34a"}}>
                            ✅ Marks Entered ({studentsWithMarks.length} students)
                          </Typography>
                          <Box sx={{overflowX:"auto"}}>
                            <table style={{width:"100%",borderCollapse:"collapse"}}>
                              <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                                <th style={S.th}>#</th>
                                <th style={S.th}>Name</th>
                                <th style={S.th}>Roll No</th>
                                <th style={S.th}>Marks</th>
                                <th style={S.th}>Grade</th>
                                <th style={S.th}>Grade Pts</th>
                                <th style={S.th}>Edit</th>
                              </tr></thead>
                              <tbody>
                                {studentsWithMarks.map((m,i)=>{
                                  // find student name
                                  const stu=students.find(s=>String(s.id)===String(m.student_id));
                                  return (
                                    <tr key={m.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                                      <td style={{...S.td,color:"#94a3b8"}}>{i+1}</td>
                                      <td style={{...S.td,fontWeight:600}}>{m.student_name||stu?.name||"—"}</td>
                                      <td style={{...S.td,fontFamily:"monospace",fontSize:"12px"}}>{stu?.rollno||"—"}</td>
                                      <td style={{...S.td,fontWeight:800,fontSize:"16px",color:"#1e293b"}}>{m.marks_scored}</td>
                                      <td style={S.td}>
                                        <span style={{background:m.grade==="F"?"#fee2e2":"#dcfce7",color:m.grade==="F"?"#dc2626":"#16a34a",
                                          padding:"3px 12px",borderRadius:"999px",fontWeight:700,fontSize:"13px"}}>
                                          {m.grade}
                                        </span>
                                      </td>
                                      <td style={{...S.td,color:"#64748b"}}>{m.grade_points}</td>
                                      <td style={S.td}>
                                        {/* EDIT ONLY — no delete */}
                                        <IconButton size="small" sx={{color:"#2563eb"}} title="Edit marks"
                                          onClick={()=>setEditingMark({...m,student_name:m.student_name||stu?.name||"—",subject_name:selectedSubject.subject_name})}>
                                          <EditIcon fontSize="small"/>
                                        </IconButton>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </Box>
                        </Box>
                      )}

                      {studentsWithMarks.length===0&&studentsWithoutMarks.length===0&&(
                        <Box sx={{...S.card,textAlign:"center",color:"#94a3b8",py:4}}>No students found in this department.</Box>
                      )}
                    </Box>
                  )}

                  {!selectedSubject&&subjects.length>0&&(
                    <Box sx={{...S.card,textAlign:"center",color:"#94a3b8",py:5}}>
                      <Typography sx={{fontSize:"32px",mb:1}}>📋</Typography>
                      <Typography sx={{fontWeight:600}}>Select a subject above to view and enter marks.</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* ── Bulk upload mode ── */}
              {marksMode==="upload" && (
                <Box>
                  <Box sx={{...S.card,mb:3,border:"2px dashed #cbd5e1"}}>
                    <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start"}}>
                      <Box sx={{flex:"0 0 300px"}}>
                        <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,color:"#0f172a"}}>📂 Upload Excel File</Typography>
                        <label style={{display:"block",cursor:"pointer"}}>
                          <Box sx={{border:"2px dashed #94a3b8",borderRadius:"12px",p:"24px",textAlign:"center",background:"#f8fafc"}}>
                            <Typography sx={{fontSize:"32px",mb:1}}>📊</Typography>
                            <Typography sx={{fontWeight:600,fontSize:"14px",color:"#1e293b",mb:0.5}}>{xlFileName||"Click to choose file"}</Typography>
                            <Typography sx={{fontSize:"12px",color:"#64748b"}}>{xlFileName?"File selected ✓":".csv · .xlsx · .xls"}</Typography>
                          </Box>
                          <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])parseExcel(e.target.files[0]);e.target.value="";}}/>
                        </label>
                        {xlRows.length>0&&<button style={{...S.btn,marginTop:"12px",opacity:xlLoading?0.6:1}} disabled={xlLoading} onClick={submitExcel}>{xlLoading?"⏳ Uploading...":`⬆️ Submit ${xlRows.filter(r=>r.status!=="ok").length} Row(s)`}</button>}
                        {xlRows.length>0&&!xlLoading&&<button onClick={()=>{setXlRows([]);setXlMsg("");setXlFileName("");}} style={{width:"100%",marginTop:"8px",padding:"10px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600,color:"#64748b"}}>🗑 Clear</button>}
                        {xlMsg&&<Box sx={{mt:1.5,p:"10px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:600,background:xlMsg.startsWith("✅")?"#f0fdf4":"#fef2f2",border:xlMsg.startsWith("✅")?"1px solid #86efac":"1px solid #fca5a5",color:xlMsg.startsWith("✅")?"#16a34a":"#dc2626"}}>{xlMsg}</Box>}
                      </Box>
                      <Box sx={{flex:"1 1 280px"}}>
                        <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,color:"#0f172a"}}>📋 Format</Typography>
                        <Box sx={{...S.card,p:0,overflow:"hidden",mb:2,border:"1px solid #e2e8f0"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                            <thead><tr style={{background:"#1e293b",color:"#94a3b8"}}>{["Col A","Col B","Col C","Col D"].map(h=><th key={h} style={{...S.th,padding:"8px 12px",fontSize:"11px"}}>{h}</th>)}</tr></thead>
                            <tbody><tr style={{background:"#f8fafc"}}>
                              <td style={{...S.td,padding:"8px 12px",fontWeight:700,color:"#0891b2"}}>roll_no</td>
                              <td style={{...S.td,padding:"8px 12px",fontWeight:700,color:"#7c3aed"}}>semester</td>
                              <td style={{...S.td,padding:"8px 12px",fontWeight:700,color:"#d97706"}}>subject</td>
                              <td style={{...S.td,padding:"8px 12px",fontWeight:700,color:"#16a34a"}}>marks</td>
                            </tr></tbody>
                          </table>
                        </Box>
                        <button onClick={()=>{const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent("roll_no,semester,subject,marks\nROLL001,Sem 1,Subject Name,85\n");a.download="marks_template.csv";a.click();}}
                          style={{width:"100%",padding:"10px",background:"linear-gradient(90deg,#0891b2,#0e7490)",color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:600}}>
                          ⬇️ Download Template (.csv)
                        </button>
                      </Box>
                    </Box>
                  </Box>

                  {xlRows.length>0&&(
                    <Box sx={{...S.card,p:0,overflowX:"auto"}}>
                      <div style={{padding:"16px 20px",fontWeight:700,fontSize:"15px",borderBottom:"1px solid #f1f5f9"}}>
                        Preview — {xlRows.length} rows &nbsp;
                        <span style={{fontSize:"12px",fontWeight:400,color:"#64748b"}}>{xlRows.filter(r=>r.status==="ok").length} saved · {xlRows.filter(r=>r.status==="error").length} errors · {xlRows.filter(r=>r.status==="pending").length} pending</span>
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                        <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                          <th style={{...S.th,color:"#94a3b8"}}>#</th>
                          <th style={{...S.th,color:"#94a3b8"}}>Roll No</th>
                          <th style={{...S.th,color:"#94a3b8"}}>Semester</th>
                          <th style={{...S.th,color:"#94a3b8"}}>Subject</th>
                          <th style={{...S.th,color:"#94a3b8"}}>Marks</th>
                          <th style={{...S.th,color:"#94a3b8"}}>Status</th>
                        </tr></thead>
                        <tbody>
                          {xlRows.map((row,i)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:row.status==="ok"?"#f0fdf4":row.status==="error"?"#fef2f2":"#f8fafc"}}>
                              <td style={{...S.td,color:"#94a3b8"}}>{row.row}</td>
                              <td style={{...S.td,fontFamily:"monospace",fontSize:"12px"}}>{row.roll_no}</td>
                              <td style={S.td}>{row.semester}</td>
                              <td style={S.td}>{row.subject}</td>
                              <td style={{...S.td,fontWeight:700}}>{row.marks}</td>
                              <td style={S.td}>
                                {row.status==="ok"&&<span style={{background:"#dcfce7",color:"#16a34a",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700,border:"1px solid #bbf7d0"}}>✅ {row.message}</span>}
                                {row.status==="pending"&&<span style={{color:"#94a3b8",fontSize:"12px",fontWeight:600}}>⏳</span>}
                                {row.status==="error"&&<Box sx={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",p:"6px 10px",fontSize:"11px",color:"#dc2626",fontWeight:600}}>❌ {row.message}</Box>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* ══════════ ATTENDANCE ══════════ */}
          {tab==="Attendance" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Attendance</Typography>
              <MsgBox msg={aMsg}/>
              <Box sx={{...S.card,maxWidth:500,mb:4}}>
                <RollInput value={aRoll} onChange={v=>rollChange(v,setARoll,setAStud,setAErr)} onSelect={s=>pickStud(s,setAStud,setAErr,setARoll)} pool={students}/>
                <FoundBanner student={aStud} error={aErr}/>
                <select style={S.inp} value={aSem} onChange={e=>setASem(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{display:"flex",gap:"12px"}}>
                  <input style={{...S.inp,flex:1}} type="number" min="0" placeholder="Completed Days" value={aPres} onChange={e=>setAPres(e.target.value)}/>
                  <input style={{...S.inp,flex:1}} type="number" min="1" placeholder="Total Planned Days" value={aTotal} onChange={e=>setATotal(e.target.value)}/>
                </div>
                {attEff!==null&&(
                  <Box sx={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"10px",p:2,mb:2,textAlign:"center"}}>
                    <Typography sx={{fontSize:"12px",color:"#64748b",mb:0.5}}>Attendance = ({aPres}/{aTotal}) × 100</Typography>
                    <Typography sx={{fontSize:"36px",fontWeight:800,color:parseFloat(attEff)>=75?"#16a34a":"#dc2626"}}>{attEff}%</Typography>
                    <Typography sx={{fontSize:"12px",fontWeight:600,color:parseFloat(attEff)>=75?"#16a34a":"#dc2626"}}>{parseFloat(attEff)>=75?"✓ Eligible for Exam":"⚠ Below 75% — Shortage"}</Typography>
                  </Box>
                )}
                <button style={{...S.btn,opacity:aStud?1:0.5}} onClick={addAtt} disabled={!aStud}>Save Attendance</button>
              </Box>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"16px"}}>
                {["All",...SEMESTERS].map(sem=>{
                  const cnt=sem==="All"?attendance.length:attendance.filter(a=>a.semester===sem).length;
                  return <button key={sem} onClick={()=>setASemFilter(sem)} style={{padding:"7px 16px",borderRadius:"20px",border:"none",cursor:"pointer",fontWeight:600,fontSize:"12px",transition:"all 0.2s",background:aSemFilter===sem?"linear-gradient(90deg,#1e3c72,#2a5298)":"#fff",color:aSemFilter===sem?"#fff":"#475569",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>{sem} <span style={{opacity:0.7,fontSize:"11px"}}>({cnt})</span></button>;
                })}
              </div>
              <Box sx={{...S.card,p:0,overflowX:"auto",mb:4}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                    <th style={S.th}>#</th>
                    <SortTh label="Student"    col="student_name"          sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                    <SortTh label="Semester"   col="semester"              sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                    <SortTh label="Completed"  col="present_days"          sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                    <SortTh label="Total Days" col="total_days"            sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                    <SortTh label="Efficiency %" col="attendance_percentage" sortCol={attSort.sortCol} sortDir={attSort.sortDir} onToggle={attSort.toggle}/>
                  </tr></thead>
                  <tbody>
                    {attSort.sort(attPag.slice,(r,c)=>r[c]).map((a,i)=>{
                      const pct=a.present_days!=null&&a.total_days>0?((a.present_days/a.total_days)*100).toFixed(1):Number(a.attendance_percentage||0).toFixed(1);
                      return (
                        <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                          <td style={{...S.td,color:"#94a3b8"}}>{(attPag.page-1)*attPag.size+i+1}</td>
                          <td style={{...S.td,fontWeight:500}}>{a.student_name||"—"}</td>
                          <td style={S.td}>{a.semester}</td>
                          <td style={S.td}>{a.present_days??"-"}</td>
                          <td style={S.td}>{a.total_days??"-"}</td>
                          <td style={S.td}><span style={{fontWeight:700,color:parseFloat(pct)>=75?"#16a34a":"#dc2626"}}>{pct}%</span></td>
                        </tr>
                      );
                    })}
                    {attPag.slice.length===0&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"24px"}}>No records for {aSemFilter}</td></tr>}
                  </tbody>
                </table>
                <PaginationBar {...attPag}/>
              </Box>
            </Box>
          )}

          {/* ══════════ EFFICIENCY ══════════ */}
          {tab==="Efficiency" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:1}}>Student Efficiency Data</Typography>
              <Typography sx={{color:"#64748b",mb:3,fontSize:"13px"}}>Score = Skills×30% + Achievements×20% + Activities×20% + CGPA×30%</Typography>
              <MsgBox msg={eMsg}/>
              <Box sx={{...S.card,maxWidth:480,mb:3}}>
                <RollInput value={eRoll}
                  onChange={v=>{setERoll(v);setEData(null);setEScore(null);resetEForm();rollChange(v,setERoll,setEStud,setEErr);}}
                  onSelect={s=>{setEStud(s);setERoll(s.rollno);setEErr("");setEData(null);setEScore(null);resetEForm();}}
                  pool={students}/>
                <FoundBanner student={eStud} error={eErr}/>
              </Box>

              {eStud&&(
                <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start"}}>
                  <Box sx={{flex:"0 0 340px"}}>
                    <Box sx={{...S.card,border:`2px solid ${eEditId?"#f59e0b":"#e2e8f0"}`,background:eEditId?"#fffbeb":"#fff",mb:3}}>
                      <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
                        <Typography sx={{fontWeight:700,fontSize:"15px",color:"#0f172a"}}>{eEditId?"✏️ Edit Entry":"➕ Add Entry"}</Typography>
                        {eEditId&&<button onClick={resetEForm} style={{background:"none",border:"1px solid #cbd5e1",borderRadius:"6px",padding:"3px 10px",fontSize:"12px",cursor:"pointer",color:"#64748b"}}>✕ Cancel</button>}
                      </Box>
                      <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Type</Typography>
                      <select style={S.inp} value={eType} disabled={!!eEditId}
                        onChange={e=>{setEType(e.target.value);setESkill("");setESkillPts("");setEActType("");setEActDesc("");setEActPts("");setEAchName("");setEAchPts("");}}>
                        <option value="">— Select —</option>
                        <option value="skill">🎯 Skill Level</option>
                        <option value="activity">🏃 Activity</option>
                        <option value="achievement">🏆 Achievement</option>
                      </select>
                      {eType==="skill"&&(<>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Skill / Level Name</Typography>
                        <input style={S.inp} placeholder="e.g. Python Expert" value={eSkill} onChange={e=>setESkill(e.target.value)}/>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Points</Typography>
                        <input style={S.inp} type="number" placeholder="e.g. 75" value={eSkillPts} onChange={e=>setESkillPts(e.target.value)}/>
                        <button style={S.btn} onClick={setSkill}>Save Skill</button>
                      </>)}
                      {eType==="activity"&&(<>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Activity Type</Typography>
                        <select style={S.inp} value={eActType} onChange={e=>{setEActType(e.target.value);if(!eActPts)setEActPts(String(ACT_PTS[e.target.value]||"")); }}>
                          <option value="">Select activity</option>
                          {Object.entries(ACT_PTS).map(([t,p])=><option key={t} value={t}>{t} — default {p} pts</option>)}
                        </select>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Description <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></Typography>
                        <input style={S.inp} placeholder="e.g. Blood donation camp" value={eActDesc} onChange={e=>setEActDesc(e.target.value)}/>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Points</Typography>
                        <input style={S.inp} type="number" placeholder="e.g. 20" value={eActPts} onChange={e=>setEActPts(e.target.value)}/>
                        <button style={S.btn} onClick={addAct}>{eEditId?"Update Activity":"Add Activity"}</button>
                      </>)}
                      {eType==="achievement"&&(<>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Achievement Name</Typography>
                        <input style={S.inp} placeholder="e.g. State Level Chess Winner" value={eAchName} onChange={e=>setEAchName(e.target.value)}/>
                        <Typography sx={{fontSize:"11px",fontWeight:600,color:"#64748b",mb:"5px",letterSpacing:"0.5px",textTransform:"uppercase"}}>Points</Typography>
                        <input style={S.inp} type="number" placeholder="e.g. 30" value={eAchPts} onChange={e=>setEAchPts(e.target.value)}/>
                        <button style={S.btn} onClick={addAch}>{eEditId?"Update Achievement":"Add Achievement"}</button>
                      </>)}
                    </Box>

                    {eScore&&(()=>{
                      const CD="#0369a1",CB="#e0f2fe",CBd="#7dd3fc";
                      const AD="#c2410c",AB="#ffedd5",ABd="#fdba74";
                      const DD="#6d28d9",DB="#f5f3ff",DBd="#ddd6fe";
                      const OD="#1d4ed8",OB="#eff6ff",OBd="#bfdbfe";
                      const icon=p=>p>=90?"🏆":p>=75?"🥇":p>=50?"📈":"📉";
                      const params=[
                        {label:"Skills",emoji:"🎯",dept:eScore.deptPercentile?.skill,all:eScore.allPercentile?.skill},
                        {label:"Achievements",emoji:"🏆",dept:eScore.deptPercentile?.achievement,all:eScore.allPercentile?.achievement},
                        {label:"Activities",emoji:"🏃",dept:eScore.deptPercentile?.activity,all:eScore.allPercentile?.activity},
                        {label:"CGPA",emoji:"📚",dept:eScore.deptPercentile?.cgpa,all:eScore.allPercentile?.cgpa},
                      ];
                      return (
                        <Box sx={{...S.card,border:`2px solid ${bandColor(eScore.band)}22`}}>
                          <Box sx={{textAlign:"center",mb:2,pb:2,borderBottom:"1px solid #f1f5f9"}}>
                            <Typography sx={{fontSize:"11px",fontWeight:700,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase",mb:0.5}}>Overall Score</Typography>
                            <Typography sx={{fontSize:"48px",fontWeight:800,color:bandColor(eScore.band),lineHeight:1}}>{eScore.finalScore}</Typography>
                            <span style={{display:"inline-block",marginTop:"6px",padding:"3px 14px",borderRadius:"999px",fontWeight:700,fontSize:"12px",background:bandColor(eScore.band)+"22",color:bandColor(eScore.band),border:`1px solid ${bandColor(eScore.band)}`}}>{eScore.band}</span>
                            <Box sx={{display:"flex",justifyContent:"center",gap:1.5,mt:1.5}}>
                              <Box sx={{background:DB,border:`1px solid ${DBd}`,borderRadius:"8px",px:1.5,py:0.5,textAlign:"center"}}>
                                <Typography sx={{fontSize:"10px",color:DD,fontWeight:600}}>DEPT RANK</Typography>
                                <Typography sx={{fontSize:"16px",fontWeight:800,color:DD,lineHeight:1.2}}>#{eScore.deptRank??"-"}<span style={{fontSize:"10px",fontWeight:400,color:"#94a3b8"}}>/{eScore.deptTotal??"-"}</span></Typography>
                              </Box>
                              <Box sx={{background:OB,border:`1px solid ${OBd}`,borderRadius:"8px",px:1.5,py:0.5,textAlign:"center"}}>
                                <Typography sx={{fontSize:"10px",color:OD,fontWeight:600}}>OVERALL RANK</Typography>
                                <Typography sx={{fontSize:"16px",fontWeight:800,color:OD,lineHeight:1.2}}>#{eScore.overallRank??"-"}<span style={{fontSize:"10px",fontWeight:400,color:"#94a3b8"}}>/{eScore.overallTotal??"-"}</span></Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Box sx={{display:"flex",gap:1,mb:2}}>
                            <Box sx={{flex:1,background:CB,border:`1px solid ${CBd}`,borderRadius:"8px",p:"8px",textAlign:"center"}}>
                              <Typography sx={{fontSize:"10px",fontWeight:700,color:CD,textTransform:"uppercase",letterSpacing:"0.4px"}}>Dept</Typography>
                              <Typography sx={{fontSize:"22px",fontWeight:800,color:CD,lineHeight:1.2}}>{eScore.deptPercentile?.overall??0}%</Typography>
                              <Typography sx={{fontSize:"10px",color:CD,fontWeight:500}}>better than dept {icon(eScore.deptPercentile?.overall??0)}</Typography>
                            </Box>
                            <Box sx={{flex:1,background:AB,border:`1px solid ${ABd}`,borderRadius:"8px",p:"8px",textAlign:"center"}}>
                              <Typography sx={{fontSize:"10px",fontWeight:700,color:AD,textTransform:"uppercase",letterSpacing:"0.4px"}}>Overall</Typography>
                              <Typography sx={{fontSize:"22px",fontWeight:800,color:AD,lineHeight:1.2}}>{eScore.allPercentile?.overall??0}%</Typography>
                              <Typography sx={{fontSize:"10px",color:AD,fontWeight:500}}>better than all {icon(eScore.allPercentile?.overall??0)}</Typography>
                            </Box>
                          </Box>
                          <Typography sx={{fontSize:"11px",fontWeight:700,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase",mb:1}}>Parameter Breakdown</Typography>
                          {params.map(({label,emoji,dept,all})=>{
                            const d=dept??0,a=all??0;
                            return (
                              <Box key={label} sx={{mb:1.5,background:"#f8fafc",borderRadius:"8px",p:"10px 12px",border:"1px solid #f1f5f9"}}>
                                <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:0.8}}>
                                  <Typography sx={{fontSize:"12px",fontWeight:700,color:"#1e293b"}}>{emoji} {label}</Typography>
                                  <Box sx={{display:"flex",gap:0.8}}>
                                    <span style={{background:CB,color:CD,border:`1px solid ${CBd}`,padding:"2px 8px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>Dept {d}%</span>
                                    <span style={{background:AB,color:AD,border:`1px solid ${ABd}`,padding:"2px 8px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>All {a}%</span>
                                  </Box>
                                </Box>
                                <Box sx={{display:"flex",flexDirection:"column",gap:"4px"}}>
                                  {[{label:"Dept",val:d,c:"#0ea5e9",bg:"#e0f2fe"},{label:"All",val:a,c:"#f97316",bg:"#ffedd5"}].map(bar=>(
                                    <Box key={bar.label} sx={{display:"flex",alignItems:"center",gap:1}}>
                                      <Typography sx={{fontSize:"9px",fontWeight:600,width:"28px",color:bar.c}}>{bar.label}</Typography>
                                      <Box sx={{flex:1,height:"6px",background:bar.bg,borderRadius:"3px",overflow:"hidden"}}><Box sx={{height:"100%",width:`${bar.val}%`,background:bar.c,borderRadius:"3px"}}/></Box>
                                      <Typography sx={{fontSize:"9px",fontWeight:700,color:bar.c,width:"26px",textAlign:"right"}}>{bar.val}%</Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            );
                          })}
                          <Box sx={{mt:1,pt:1.5,borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <Typography sx={{fontSize:"12px",color:"#64748b"}}>CGPA</Typography>
                            <Typography sx={{fontWeight:800,fontSize:"18px",color:"#0891b2"}}>{eScore.cgpa}</Typography>
                          </Box>
                        </Box>
                      );
                    })()}
                  </Box>

                  <Box sx={{flex:"1 1 400px"}}>
                    <Typography variant="h6" sx={{fontWeight:700,mb:2,fontSize:"15px"}}>Entries ({(!!eData?.skill?1:0)+(eData?.activities||[]).length+(eData?.achievements||[]).length})</Typography>
                    <Box sx={{...S.card,p:0,overflow:"hidden",mb:3}}>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead><tr style={{background:"#1e293b",color:"#fff"}}>{["#","Type","Name / Description","Points","Actions"].map(h=><th key={h} style={{...S.th,color:"#94a3b8",padding:"10px 14px"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {eData?.skill&&(
                            <tr style={{borderBottom:"1px solid #f1f5f9"}}>
                              <td style={{...S.td,color:"#94a3b8",padding:"10px 14px"}}>1</td>
                              <td style={{...S.td,padding:"10px 14px"}}><span style={{background:"#ede9fe",color:"#7c3aed",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>🎯 Skill</span></td>
                              <td style={{...S.td,fontWeight:600,padding:"10px 14px"}}>{eData.skill.skill_level}</td>
                              <td style={{...S.td,padding:"10px 14px"}}><span style={{background:"#ede9fe",color:"#7c3aed",padding:"2px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700}}>{eData.skill.skill_score} pts</span></td>
                              <td style={{...S.td,padding:"10px 14px"}}><IconButton size="small" sx={{color:"#f59e0b"}} onClick={()=>{setEType("skill");setESkill(eData.skill.skill_level);setESkillPts(String(eData.skill.skill_score));setEEditId("skill");}}><EditIcon fontSize="small"/></IconButton></td>
                            </tr>
                          )}
                          {(eData?.activities||[]).map((a,idx)=>(
                            <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                              <td style={{...S.td,color:"#94a3b8",padding:"10px 14px"}}>{(eData?.skill?2:1)+idx}</td>
                              <td style={{...S.td,padding:"10px 14px"}}><span style={{background:"#dbeafe",color:"#2563eb",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>🏃 Activity</span></td>
                              <td style={{...S.td,padding:"10px 14px"}}><Typography sx={{fontSize:"13px",fontWeight:600}}>{a.activity_type}</Typography>{a.description&&<Typography sx={{fontSize:"11px",color:"#64748b"}}>{a.description}</Typography>}</td>
                              <td style={{...S.td,padding:"10px 14px"}}><span style={{background:"#dbeafe",color:"#2563eb",padding:"2px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700}}>{a.points} pts</span></td>
                              <td style={{...S.td,padding:"10px 14px",display:"flex",gap:"2px"}}>
                                <IconButton size="small" sx={{color:"#f59e0b"}} onClick={()=>{setEType("activity");setEActType(a.activity_type);setEActDesc(a.description||"");setEActPts(String(a.points));setEEditId(a.id);}}><EditIcon fontSize="small"/></IconButton>
                                <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAct(a.id)}><DeleteIcon fontSize="small"/></IconButton>
                              </td>
                            </tr>
                          ))}
                          {(eData?.achievements||[]).map((a,idx)=>(
                            <tr key={a.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                              <td style={{...S.td,color:"#94a3b8",padding:"10px 14px"}}>{(eData?.skill?2:1)+(eData?.activities||[]).length+idx}</td>
                              <td style={{...S.td,padding:"10px 14px"}}><span style={{background:"#fef3c7",color:"#d97706",padding:"3px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700}}>🏆 Achievement</span></td>
                              <td style={{...S.td,fontWeight:600,padding:"10px 14px"}}>{a.achievement_name}</td>
                              <td style={{...S.td,padding:"10px 14px"}}><span style={{background:"#fef3c7",color:"#d97706",padding:"2px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700}}>{a.points} pts</span></td>
                              <td style={{...S.td,padding:"10px 14px",display:"flex",gap:"2px"}}>
                                <IconButton size="small" sx={{color:"#f59e0b"}} onClick={()=>{setEType("achievement");setEAchName(a.achievement_name);setEAchPts(String(a.points));setEEditId(a.id);}}><EditIcon fontSize="small"/></IconButton>
                                <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAch(a.id)}><DeleteIcon fontSize="small"/></IconButton>
                              </td>
                            </tr>
                          ))}
                          {!eData?.skill&&!(eData?.activities?.length)&&!(eData?.achievements?.length)&&(
                            <tr><td colSpan={5} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"32px",fontSize:"13px"}}>No entries yet</td></tr>
                          )}
                        </tbody>
                      </table>
                    </Box>
                    <Typography variant="h6" sx={{fontWeight:700,mb:2,fontSize:"15px"}}>All Students Efficiency</Typography>
                    <Box sx={{...S.card,p:0,overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                          <th style={S.th}>#</th>
                          <SortTh label="Name"   col="name"       sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                          <SortTh label="Roll"   col="rollno"     sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                          <SortTh label="Score"  col="finalScore" sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                          <SortTh label="CGPA"   col="cgpa"       sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                          <th style={S.th}>Band</th>
                          <SortTh label="D.Rank" col="deptRank"   sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                        </tr></thead>
                        <tbody>
                          {effSort.sort(effPag.slice,(r,c)=>r[c]).map((e,i)=>(
                            <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                              <td style={{...S.td,color:"#94a3b8"}}>{(effPag.page-1)*effPag.size+i+1}</td>
                              <td style={{...S.td,fontWeight:600}}>{e.name}</td>
                              <td style={{...S.td,fontFamily:"monospace",fontSize:"12px"}}>{e.rollno}</td>
                              <td style={{...S.td,fontWeight:800,color:bandColor(e.band)}}>{e.finalScore}</td>
                              <td style={{...S.td,fontWeight:600,color:"#0891b2"}}>{e.cgpa}</td>
                              <td style={S.td}><span style={{background:bandColor(e.band)+"20",color:bandColor(e.band),padding:"3px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{e.band}</span></td>
                              <td style={{...S.td,color:"#64748b"}}>#{e.deptRank}/{e.deptTotal}</td>
                            </tr>
                          ))}
                          {effPag.slice.length===0&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"24px"}}>No efficiency data yet</td></tr>}
                        </tbody>
                      </table>
                      <PaginationBar {...effPag}/>
                    </Box>
                  </Box>
                </Box>
              )}

              {!eStud&&(
                <Box sx={{...S.card,p:0,overflowX:"auto"}}>
                  <div style={{padding:"16px 20px",fontWeight:700,fontSize:"15px",borderBottom:"1px solid #f1f5f9"}}>All Students Efficiency ({allEff.length})</div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                      <th style={S.th}>#</th>
                      <SortTh label="Name"   col="name"       sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                      <SortTh label="Roll"   col="rollno"     sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                      <SortTh label="Score"  col="finalScore" sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                      <SortTh label="CGPA"   col="cgpa"       sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                      <th style={S.th}>Band</th>
                      <SortTh label="D.Rank" col="deptRank"   sortCol={effSort.sortCol} sortDir={effSort.sortDir} onToggle={effSort.toggle}/>
                    </tr></thead>
                    <tbody>
                      {effSort.sort(effPag.slice,(r,c)=>r[c]).map((e,i)=>(
                        <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                          <td style={{...S.td,color:"#94a3b8"}}>{(effPag.page-1)*effPag.size+i+1}</td>
                          <td style={{...S.td,fontWeight:600}}>{e.name}</td>
                          <td style={{...S.td,fontFamily:"monospace",fontSize:"12px"}}>{e.rollno}</td>
                          <td style={{...S.td,fontWeight:800,color:bandColor(e.band)}}>{e.finalScore}</td>
                          <td style={{...S.td,fontWeight:600,color:"#0891b2"}}>{e.cgpa}</td>
                          <td style={S.td}><span style={{background:bandColor(e.band)+"20",color:bandColor(e.band),padding:"3px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{e.band}</span></td>
                          <td style={{...S.td,color:"#64748b"}}>#{e.deptRank}/{e.deptTotal}</td>
                        </tr>
                      ))}
                      {effPag.slice.length===0&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"24px"}}>No efficiency data yet</td></tr>}
                    </tbody>
                  </table>
                  <PaginationBar {...effPag}/>
                </Box>
              )}
            </Box>
          )}

          {/* ══════════ ANNOUNCEMENTS ══════════ */}
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
                ?<Typography sx={{color:"#94a3b8"}}>No announcements yet.</Typography>
                :announcements.map(ann=>(
                  <Box key={ann.id} sx={{...S.card,mb:2,borderLeft:"4px solid #2563eb",p:"20px 24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"11px",padding:"2px 10px",borderRadius:"999px",background:"#fee2e2",color:"#dc2626",border:"1px solid #fca5a5",fontWeight:600}}>{ann.target==="all"?"Super Admin → All":ann.target+" Dept"}</span>
                      <span style={{fontSize:"11px",color:"#94a3b8",marginLeft:"auto"}}>{ann.created_at?new Date(ann.created_at).toLocaleString():""}</span>
                      <IconButton size="small" sx={{color:"#ef4444"}} onClick={()=>delAnn(ann.id)}><DeleteIcon fontSize="small"/></IconButton>
                    </div>
                    <Typography sx={{fontWeight:700,fontSize:"16px",mb:0.5}}>{ann.title}</Typography>
                    <Typography sx={{color:"#475569",fontSize:"14px",mb:1.5}}>{ann.message}</Typography>
                    {(replies[ann.id]||[]).length>0&&(
                      <Box sx={{mb:1.5,pl:1.5,borderLeft:"2px solid #e2e8f0"}}>
                        {(replies[ann.id]||[]).map((r,i)=>(
                          <Box key={i} sx={{background:"#f8fafc",borderRadius:"8px",p:"8px 12px",mb:0.8}}>
                            <Typography sx={{fontSize:"12px",color:"#2563eb",fontWeight:600}}>
                              {r.user_name||"User"}
                              {r.user_role&&<span style={{marginLeft:"6px",fontSize:"10px",background:"#f1f5f9",color:"#64748b",padding:"1px 7px",borderRadius:"999px"}}>{r.user_role}</span>}
                              {r.is_voice===1&&<span style={{color:"#7c3aed",marginLeft:"6px",fontSize:"10px"}}>🎤 voice</span>}
                            </Typography>
                            <Typography sx={{fontSize:"13px",color:"#475569"}}>{r.reply_text}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
                      <input style={{flex:1,minWidth:"160px",padding:"9px 14px",fontSize:"13px",border:"1px solid #e2e8f0",borderRadius:"8px",outline:"none",fontFamily:FONT}}
                        placeholder="Write a reply…" value={repTxt[ann.id]||""}
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

          {/* ══════════ FACULTY ══════════ */}
          {tab==="Faculty" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Faculty Management</Typography>
              <MsgBox msg={fMsg}/>
              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start",mb:4}}>
                {/* Add form — NO permission info blocks */}
                <Box sx={{flex:"0 0 320px",...S.card}}>
                  <Typography sx={{fontWeight:700,fontSize:"15px",mb:2,color:"#0f172a"}}>➕ Add Faculty Member</Typography>
                  <input style={S.inp} placeholder="Full Name *"        value={fName}  onChange={e=>{setFName(e.target.value);setFMsg("");}}/>
                  <input style={S.inp} placeholder="Email / Login ID *" value={fEmail} onChange={e=>{setFEmail(e.target.value);setFMsg("");}}/>
                  <input style={S.inp} type="password" placeholder="Password * (min 4)" value={fPwd} onChange={e=>{setFPwd(e.target.value);setFMsg("");}}/>
                  <input style={S.inp} placeholder="Phone Number (optional)" value={fPhone} onChange={e=>setFPhone(e.target.value)}/>
                  <Box sx={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:"8px",p:"11px 14px",mb:2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <Typography sx={{fontSize:"13px",color:"#64748b"}}>Department</Typography>
                    <span style={{background:"#2563eb",color:"#fff",padding:"3px 12px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>{userDept}</span>
                  </Box>
                  <button style={S.btn} onClick={addFaculty}>Add Faculty</button>
                </Box>

                <Box sx={{flex:"1 1 380px"}}>
                  <Typography variant="h6" sx={{fontWeight:700,mb:2}}>Faculty in {userDept} Dept ({faculty.length})</Typography>
                  <Box sx={{...S.card,p:0,overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr style={{background:"#1e293b",color:"#fff"}}>
                        <th style={S.th}>#</th>
                        <SortTh label="Name"  col="name"  sortCol={facSort.sortCol} sortDir={facSort.sortDir} onToggle={facSort.toggle}/>
                        <SortTh label="Email" col="email" sortCol={facSort.sortCol} sortDir={facSort.sortDir} onToggle={facSort.toggle}/>
                        <th style={S.th}>Phone</th>
                        <th style={S.th}>Status</th>
                        <th style={S.th}>Actions</th>
                      </tr></thead>
                      <tbody>
                        {facSort.sort(facPag.slice,(r,c)=>r[c]).map((f,i)=>(
                          <tr key={f.id} style={{borderBottom:"1px solid #f1f5f9",opacity:f.is_active===0?0.7:1}}>
                            <td style={{...S.td,color:"#94a3b8"}}>{(facPag.page-1)*facPag.size+i+1}</td>
                            <td style={{...S.td,fontWeight:600}}>{f.name}</td>
                            <td style={S.td}>{f.email}</td>
                            <td style={S.td}>{f.phone?<a href={`tel:${f.phone}`} style={{color:"#2563eb",textDecoration:"none",fontWeight:500}}>📞 {f.phone}</a>:<span style={{color:"#94a3b8"}}>—</span>}</td>
                            <td style={S.td}>
                              <span style={{background:f.is_active!==0?"#dcfce7":"#fee2e2",color:f.is_active!==0?"#16a34a":"#dc2626",padding:"3px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:600}}>
                                {f.is_active!==0?"● Active":"○ Inactive"}
                              </span>
                            </td>
                            <td style={S.td}>
                              {/* EDIT + Active/Inactive toggle — NO delete */}
                              <div style={{display:"flex",gap:"4px"}}>
                                <IconButton size="small" sx={{color:"#2563eb"}} title="Edit" onClick={()=>setEditingFaculty(f)}><EditIcon fontSize="small"/></IconButton>
                                <IconButton size="small"
                                  sx={{color:f.is_active!==0?"#ef4444":"#16a34a"}}
                                  title={f.is_active!==0?"Set Inactive":"Set Active"}
                                  onClick={()=>toggleFacultyStatus(f)}>
                                  {f.is_active!==0?<CancelIcon fontSize="small"/>:<CheckCircleIcon fontSize="small"/>}
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {faculty.length===0&&<tr><td colSpan={6} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"28px",fontSize:"13px"}}>No faculty members added yet</td></tr>}
                      </tbody>
                    </table>
                    <PaginationBar {...facPag}/>
                  </Box>
                </Box>
              </Box>

              {/* Faculty Password Reset */}
              <Box sx={{mt:2}}>
                <Typography variant="h6" sx={{fontWeight:700,mb:2,fontSize:"15px"}}>🔑 Reset Faculty Password</Typography>
                <Box sx={{...S.card,maxWidth:500,borderTop:"4px solid #d97706"}}>
                  <Typography sx={{fontSize:"12px",color:"#64748b",mb:2}}>Select a faculty member and set a new password.</Typography>
                  <MsgBox msg={facResetMsg}/>
                  <select style={S.inp} value={facResetId||""} onChange={e=>{setFacResetId(e.target.value||null);setFacResetMsg("");}}>
                    <option value="">— Select Faculty Member —</option>
                    {faculty.map(f=><option key={f.id} value={f.id}>{f.name} ({f.email})</option>)}
                  </select>
                  <input style={S.inp} type="password" placeholder="New Password (min 4 chars)" value={facResetPwd} onChange={e=>{setFacResetPwd(e.target.value);setFacResetMsg("");}}/>
                  <button style={{...S.btn,background:"linear-gradient(90deg,#d97706,#b45309)",opacity:facResetId?1:0.5}} disabled={!facResetId} onClick={resetFacultyPassword}>Reset Faculty Password</button>
                </Box>
              </Box>
            </Box>
          )}

          {/* ══════════ PASSWORD ══════════ */}
          {tab==="Password" && (
            <Box>
              <Typography variant="h5" sx={{fontWeight:700,mb:3}}>Password Management</Typography>
              <Box sx={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"flex-start"}}>
                <Box sx={{flex:"0 0 360px",...S.card,borderTop:"4px solid #2563eb"}}>
                  <Typography sx={{fontWeight:700,fontSize:"15px",mb:0.5,color:"#1e293b"}}>🔒 Change My Password</Typography>
                  <Typography sx={{fontSize:"12px",color:"#64748b",mb:2}}>Update your own admin login password</Typography>
                  <MsgBox msg={pwdMsg}/>
                  <input style={S.inp} type="password" placeholder="Current Password" value={curPwd} onChange={e=>{setCurPwd(e.target.value);setPwdMsg("");}}/>
                  <input style={S.inp} type="password" placeholder="New Password (min 4 chars)" value={newPwd} onChange={e=>{setNewPwd(e.target.value);setPwdMsg("");}}/>
                  <button style={S.btn} onClick={changePassword}>Update Password</button>
                </Box>
                <Box sx={{flex:"0 0 360px",...S.card,borderTop:"4px solid #d97706"}}>
                  <Typography sx={{fontWeight:700,fontSize:"15px",mb:0.5,color:"#1e293b"}}>🔑 Reset Student Password</Typography>
                  <Typography sx={{fontSize:"12px",color:"#64748b",mb:2}}>Reset password for any student in your department</Typography>
                  <MsgBox msg={resetMsg}/>
                  <RollInput value={resetRoll} onChange={v=>rollChange(v,setResetRoll,setResetStud,setResetErr)} onSelect={s=>pickStud(s,setResetStud,setResetErr,setResetRoll)} pool={students}/>
                  <FoundBanner student={resetStud} error={resetErr}/>
                  <input style={S.inp} type="password" placeholder="New Password for Student (min 4 chars)" value={resetPwd} onChange={e=>{setResetPwd(e.target.value);setResetMsg("");}}/>
                  <button style={{...S.btn,background:"linear-gradient(90deg,#d97706,#b45309)",opacity:resetStud?1:0.5}} disabled={!resetStud} onClick={resetStudentPassword}>Reset Student Password</button>
                </Box>
              </Box>
            </Box>
          )}

        </Box>
      </Box>
    </>
  );
}