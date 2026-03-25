import * as React from "react";
import { useNavigate } from "react-router-dom";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import EditIcon from "@mui/icons-material/Edit";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BarChartIcon from "@mui/icons-material/BarChart";
import SchoolIcon from "@mui/icons-material/School";
import DeleteIcon from "@mui/icons-material/Delete";

const drawerWidth = 240;

/* ─── MUI STYLED ─── */
const Main = styled("main", { shouldForwardProp: (p) => p !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(4),
    marginLeft: open ? 0 : `-${drawerWidth}px`,
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
    width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
  })
);
const AppBar = styled(MuiAppBar, { shouldForwardProp: (p) => p !== "open" })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(["margin", "width"]),
    ...(open && { width: `calc(100% - ${drawerWidth}px)`, marginLeft: drawerWidth }),
    background: "linear-gradient(90deg,#141E30,#243B55)",
  })
);
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex", alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

/* ─── CONSTANTS ─── */
const DEPT_PALETTE = [
  "#2563eb","#d97706","#16a34a","#b03e17","#7c3aed",
  "#0891b2","#db2777","#65a30d","#ea580c","#0f766e",
];
const PERF_BANDS = [
  { key:"Excellent",       color:"#16a34a", bg:"#dcfce7", min:80  },
  { key:"Good",            color:"#2563eb", bg:"#dbeafe", min:60  },
  { key:"Need Improvement",color:"#d97706", bg:"#fef3c7", min:40  },
  { key:"Weak",            color:"#dc2626", bg:"#fee2e2", min:0   },
];
const PAGE_SIZE_OPTIONS = [5, 25, 100, 1000];

/* ─── STYLES ─── */
const inputStyle = {
  width:"100%", padding:"10px 14px", fontSize:"15px",
  borderRadius:"8px", border:"1px solid #cbd5e1",
  outline:"none", marginBottom:"12px", boxSizing:"border-box",
};
const btnStyle = {
  padding:"11px 24px",
  background:"linear-gradient(90deg,#1e3c72,#2a5298)",
  color:"#fff", border:"none", borderRadius:"8px",
  fontSize:"15px", cursor:"pointer", marginTop:"4px",
};
const btnSmStyle = {
  padding:"7px 16px", fontSize:"13px", cursor:"pointer",
  border:"none", borderRadius:"7px", fontWeight:600,
};

/* ─── HELPERS ─── */
function getDeptColor(name, departments) {
  const idx = departments.findIndex((d) => d.name === name);
  return DEPT_PALETTE[idx % DEPT_PALETTE.length] || "#64748b";
}
function getBand(score) {
  return PERF_BANDS.find(b => score >= b.min) || PERF_BANDS[3];
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      flex:1, background:"#fff", borderRadius:"12px", padding:"24px",
      textAlign:"center", boxShadow:"0 4px 14px rgba(0,0,0,0.08)",
      borderTop:`4px solid ${color}`, minWidth:"160px",
    }}>
      <p style={{ fontSize:"14px", color:"#64748b", marginBottom:"8px" }}>{label}</p>
      <p style={{ fontSize:"32px", fontWeight:"bold", color }}>{value}</p>
      {sub && <p style={{ fontSize:"12px", color:"#94a3b8", marginTop:"4px" }}>{sub}</p>}
    </div>
  );
}

function DeptBadge({ dept, departments = [] }) {
  const color = getDeptColor(dept, departments);
  return (
    <span style={{
      background:color, color:"#fff", padding:"3px 10px",
      borderRadius:"20px", fontSize:"12px", fontWeight:600,
    }}>{dept}</span>
  );
}

function StatusBadge({ active }) {
  return (
    <span style={{
      background: active ? "#dcfce7" : "#fee2e2",
      color: active ? "#16a34a" : "#dc2626",
      padding:"3px 10px", borderRadius:"20px", fontSize:"12px", fontWeight:600,
    }}>{active ? "● Active" : "○ Inactive"}</span>
  );
}

/* ─── PAGINATION HOOK ─── */
function usePagination(data, defaultSize = 25) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultSize);
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = data.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => setPage(1), [pageSize, data.length]);
  return { paged, page, setPage, pageSize, setPageSize, total, totalPages };
}

/* ─── PAGINATION UI ─── */
function PaginationBar({ page, totalPages, pageSize, setPage, setPageSize, total }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 16px", borderTop:"1px solid #f1f5f9",
      background:"#fafafa", borderRadius:"0 0 12px 12px",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
        <span style={{ fontSize:"13px", color:"#64748b" }}>Rows per page:</span>
        {PAGE_SIZE_OPTIONS.map(sz => (
          <button key={sz} onClick={() => setPageSize(sz)} style={{
            ...btnSmStyle,
            background: pageSize === sz ? "linear-gradient(90deg,#1e3c72,#2a5298)" : "#f1f5f9",
            color: pageSize === sz ? "#fff" : "#475569",
            padding:"5px 10px", fontSize:"12px",
          }}>{sz}</button>
        ))}
        <span style={{ fontSize:"12px", color:"#94a3b8", marginLeft:"8px" }}>
          {total} total
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        <button onClick={() => setPage(1)} disabled={page === 1} style={{ ...btnSmStyle, background:"#f1f5f9", color:"#475569", padding:"5px 10px", opacity: page===1?0.4:1 }}>«</button>
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ ...btnSmStyle, background:"#f1f5f9", color:"#475569", padding:"5px 10px", opacity: page===1?0.4:1 }}>‹</button>
        <span style={{ fontSize:"13px", color:"#475569", padding:"0 8px" }}>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={{ ...btnSmStyle, background:"#f1f5f9", color:"#475569", padding:"5px 10px", opacity: page===totalPages?0.4:1 }}>›</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ ...btnSmStyle, background:"#f1f5f9", color:"#475569", padding:"5px 10px", opacity: page===totalPages?0.4:1 }}>»</button>
      </div>
    </div>
  );
}

/* ─── EDIT ADMIN MODAL ─── */
function EditAdminModal({ admin, departments, onClose, onSave }) {
  const [form, setForm] = React.useState({
    name: admin.name || "",
    email: admin.email || "",
    phone: admin.phone || "",
    department: admin.department || "",
    is_active: admin.is_active !== 0,
    left_date: admin.left_date || "",
  });
  const [err, setErr] = React.useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setErr("Name is required"); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr("Valid email required"); return; }
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone)) { setErr("Valid 10-digit phone required"); return; }
    if (!form.department) { setErr("Department required"); return; }
    onSave({ ...form });
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
      zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        background:"#fff", borderRadius:"16px", padding:"32px",
        width:"100%", maxWidth:"480px", boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Edit Admin</Typography>
        {err && <div style={{ background:"#fee2e2", color:"#dc2626", padding:"10px 14px", borderRadius:"8px", marginBottom:"12px", fontSize:"14px" }}>{err}</div>}
        <input style={inputStyle} placeholder="Admin Name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
        <input style={inputStyle} placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
        <input style={inputStyle} placeholder="Phone (10 digits)" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
        <select style={{...inputStyle, background:"#fff", cursor:"pointer"}} value={form.department} onChange={e => setForm({...form, department:e.target.value})}>
          {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
        </select>
        <div style={{ marginBottom:"12px" }}>
          <label style={{ fontWeight:600, fontSize:"14px", display:"block", marginBottom:"6px" }}>Status</label>
          <div style={{ display:"flex", gap:"10px" }}>
            <button onClick={() => setForm({...form, is_active:true, left_date:""})} style={{
              ...btnSmStyle, flex:1,
              background: form.is_active ? "#dcfce7" : "#f1f5f9",
              color: form.is_active ? "#16a34a" : "#475569",
              border: form.is_active ? "2px solid #16a34a" : "2px solid transparent",
            }}>● Active</button>
            <button onClick={() => setForm({...form, is_active:false})} style={{
              ...btnSmStyle, flex:1,
              background: !form.is_active ? "#fee2e2" : "#f1f5f9",
              color: !form.is_active ? "#dc2626" : "#475569",
              border: !form.is_active ? "2px solid #dc2626" : "2px solid transparent",
            }}>○ Inactive</button>
          </div>
        </div>
        {!form.is_active && (
          <div style={{ marginBottom:"12px" }}>
            <label style={{ fontWeight:600, fontSize:"14px", display:"block", marginBottom:"6px" }}>Date Left / Last Active</label>
            <input type="date" style={inputStyle} value={form.left_date} onChange={e => setForm({...form, left_date:e.target.value})} />
          </div>
        )}
        <div style={{ display:"flex", gap:"10px", marginTop:"8px" }}>
          <button onClick={handleSave} style={{...btnStyle, flex:1, marginTop:0}}>💾 Save Changes</button>
          <button onClick={onClose} style={{...btnSmStyle, flex:1, background:"#f1f5f9", color:"#475569", padding:"11px"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const theme    = useTheme();
  const navigate = useNavigate();

  const [open,         setOpen]         = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState("Dashboard");
  const [msg,          setMsg]          = React.useState("");

  /* ── data ── */
  const [stats,          setStats]          = React.useState({ totalStudents:0, totalAdmins:0, totalMarks:0, deptStats:[] });
  const [admins,         setAdmins]         = React.useState([]);
  const [departments,    setDepartments]    = React.useState([]);
  const [announcements,  setAnnouncements]  = React.useState([]);
  const [replies,        setReplies]        = React.useState({});
  const [adminByDept,    setAdminByDept]    = React.useState([]);
  const [deptEfficiency, setDeptEfficiency] = React.useState([]);
  const [allFaculty,     setAllFaculty]     = React.useState([]);
  const [allSubjects,    setAllSubjects]    = React.useState([]);
  const [allStudents,    setAllStudents]    = React.useState([]);
  const [deptPerfCounts, setDeptPerfCounts] = React.useState({});

  /* ── forms ── */
  const [adminForm, setAdminForm] = React.useState({
    name:"", email:"", password:"", department:"", phone:"",
  });
  const [adminFormErrors, setAdminFormErrors] = React.useState({});
  const [annForm,    setAnnForm]    = React.useState({ title:"", message:"", target:"all" });
  const [newDeptName, setNewDeptName] = React.useState("");

  /* ── student view ── */
  const [selectedDeptForStudents, setSelectedDeptForStudents] = React.useState("");

  /* ── edit admin ── */
  const [editingAdmin, setEditingAdmin] = React.useState(null);

  /* ── reply ── */
  const [replyText,   setReplyText]   = React.useState({});
  const [isListening, setIsListening] = React.useState(null);

  /* ── pagination states ── */
  const [adminPage, setAdminPage]     = React.useState(1);
  const [adminPageSize, setAdminPageSize] = React.useState(25);
  const [facultyPage, setFacultyPage]     = React.useState(1);
  const [facultyPageSize, setFacultyPageSize] = React.useState(25);
  const [studentPage, setStudentPage]     = React.useState(1);
  const [studentPageSize, setStudentPageSize] = React.useState(25);

  /* ── auth ── */
  const getAuthHeader = () => ({ Authorization:`Bearer ${localStorage.getItem("token")}` });

  /* ── init ── */
  React.useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchAll();
  }, []);

  React.useEffect(() => {
    if (departments.length > 0 && !adminForm.department)
      setAdminForm(prev => ({...prev, department: departments[0].name}));
  }, [departments]);

  const fetchAll = () => {
    fetchStats(); fetchAdmins(); fetchAnnouncements(); fetchDepartments();
    fetchAdminByDept(); fetchDeptEfficiency(); fetchFaculty(); fetchSubjects();
    fetchAllStudents(); fetchDeptPerfCounts();
  };

  /* ── fetchers ── */
  const fetchStats = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/stats", { headers: getAuthHeader() });
      if (res.status === 401) { localStorage.clear(); navigate("/"); return; }
      setStats(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchAdmins = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/admins", { headers: getAuthHeader() });
      if (!res.ok) return;
      setAdmins(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchDepartments = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/departments", { headers: getAuthHeader() });
      if (!res.ok) return;
      setDepartments(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/announcements", { headers: getAuthHeader() });
      if (!res.ok) return;
      const list = await res.json();
      setAnnouncements(Array.isArray(list) ? list : []);
      (Array.isArray(list) ? list : []).forEach(a => fetchReplies(a.id));
    } catch(e) { console.error(e); }
  };
  const fetchReplies = async (annId) => {
    try {
      const res = await fetch(`https://slea-backend.onrender.com/announcement/${annId}/replies`, { headers: getAuthHeader() });
      const data = await res.json();
      setReplies(prev => ({...prev, [annId]: Array.isArray(data) ? data : []}));
    } catch(e) { console.error(e); }
  };
  const fetchAdminByDept = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/admin-by-dept", { headers: getAuthHeader() });
      if (!res.ok) return;
      setAdminByDept(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchDeptEfficiency = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/dept-efficiency", { headers: getAuthHeader() });
      if (!res.ok) return;
      setDeptEfficiency(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchFaculty = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/admin/faculty", { headers: getAuthHeader() });
      if (!res.ok) return;
      setAllFaculty(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchSubjects = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/subjects", { headers: getAuthHeader() });
      if (!res.ok) return;
      setAllSubjects(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchAllStudents = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/students", { headers: getAuthHeader() });
      if (!res.ok) return;
      setAllStudents(await res.json());
    } catch(e) { console.error(e); }
  };
  const fetchDeptPerfCounts = async () => {
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/dept-perf-counts", { headers: getAuthHeader() });
      if (!res.ok) return;
      setDeptPerfCounts(await res.json());
    } catch(e) { console.error(e); }
  };

  /* ── actions ── */
  const validateAdminForm = () => {
    const errors = {};
    if (!adminForm.name.trim()) errors.name = "Name is required";
    if (!adminForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminForm.email)) errors.email = "Valid email required";
    if (!adminForm.password || adminForm.password.length < 6) errors.password = "Password min 6 characters";
    if (!adminForm.phone.trim() || !/^[6-9]\d{9}$/.test(adminForm.phone)) errors.phone = "Valid 10-digit phone required";
    if (!adminForm.department) errors.department = "Department required";
    setAdminFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = async () => {
    if (!validateAdminForm()) return;
    const { name, email, password, department, phone } = adminForm;
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/add-admin", {
        method:"POST",
        headers:{"Content-Type":"application/json", ...getAuthHeader()},
        body: JSON.stringify({ name, email, password, department, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg(`✅ ${data.message}`);
      setAdminForm({ name:"", email:"", password:"", department: departments[0]?.name||"", phone:"" });
      setAdminFormErrors({});
      fetchAdmins(); fetchStats(); fetchAdminByDept();
    } catch { setMsg("❌ Server error"); }
  };

  const handleEditAdmin = async (updatedData) => {
    try {
      const res = await fetch(`https://slea-backend.onrender.com/superadmin/admin/${editingAdmin.id}`, {
        method:"PUT",
        headers:{"Content-Type":"application/json", ...getAuthHeader()},
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg("✅ Admin updated successfully");
      setEditingAdmin(null);
      fetchAdmins(); fetchAdminByDept();
    } catch { setMsg("❌ Server error"); }
  };

  const handleToggleAdminStatus = async (admin) => {
    const newStatus = !admin.is_active;
    try {
      const res = await fetch(`https://slea-backend.onrender.com/superadmin/admin/${admin.id}`, {
        method:"PUT",
        headers:{"Content-Type":"application/json", ...getAuthHeader()},
        body: JSON.stringify({
          name: admin.name, email: admin.email, phone: admin.phone,
          department: admin.department, is_active: newStatus,
          left_date: !newStatus ? new Date().toISOString().split("T")[0] : "",
        }),
      });
      if (!res.ok) return;
      setMsg(`✅ Admin marked as ${newStatus ? "Active" : "Inactive"}`);
      fetchAdmins();
    } catch(e) { console.error(e); }
  };

  const handleAddDepartment = async () => {
    const name = newDeptName.trim();
    if (!name) { setMsg("❌ Department name required"); return; }
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/department", {
        method:"POST",
        headers:{"Content-Type":"application/json", ...getAuthHeader()},
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg(`✅ ${data.message}`);
      setNewDeptName("");
      fetchDepartments();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteDepartment = async (name) => {
    if (!window.confirm(`Remove department '${name}'?`)) return;
    try {
      const res = await fetch(`https://slea-backend.onrender.com/superadmin/department/${encodeURIComponent(name)}`, {
        method:"DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) { setMsg("❌ Failed to delete department"); return; }
      setMsg(`✅ Department '${name}' removed`);
      fetchDepartments();
    } catch(e) { console.error(e); }
  };

  const handleAddAnnouncement = async () => {
    const { title, message, target } = annForm;
    if (!title || !message) { setMsg("❌ Title and message required"); return; }
    try {
      const res = await fetch("https://slea-backend.onrender.com/superadmin/announcement", {
        method:"POST",
        headers:{"Content-Type":"application/json", ...getAuthHeader()},
        body: JSON.stringify({ title, message, target }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg("✅ Announcement posted!");
      setAnnForm({ title:"", message:"", target:"all" });
      fetchAnnouncements();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteAnn = async (id) => {
    try {
      const res = await fetch(`https://slea-backend.onrender.com/superadmin/announcement/${id}`, {
        method:"DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) return;
      fetchAnnouncements();
    } catch(e) { console.error(e); }
  };

  const startVoice = (annId) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported in this browser."); return; }
    const rec = new SR();
    rec.lang = "en-IN"; rec.interimResults = false;
    setIsListening(annId);
    rec.onresult = e => { setReplyText(prev => ({...prev, [annId]: e.results[0][0].transcript})); setIsListening(null); };
    rec.onerror = () => setIsListening(null);
    rec.onend   = () => setIsListening(null);
    rec.start();
  };

  const submitReply = async (annId, isVoice = false) => {
    const text = (replyText[annId] || "").trim();
    if (!text) return;
    try {
      await fetch(`https://slea-backend.onrender.com/announcement/${annId}/reply`, {
        method:"POST",
        headers:{"Content-Type":"application/json", ...getAuthHeader()},
        body: JSON.stringify({ reply_text:text, is_voice:isVoice }),
      });
      setReplyText(prev => ({...prev, [annId]:""}));
      fetchReplies(annId);
    } catch(e) { console.error(e); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  /* ── computed ── */
  const filteredStudents = selectedDeptForStudents
    ? allStudents.filter(s => s.department === selectedDeptForStudents)
    : [];

  // Paginate admins
  const adminTotalPages = Math.max(1, Math.ceil(admins.length / adminPageSize));
  const pagedAdmins = admins.slice((adminPage-1)*adminPageSize, adminPage*adminPageSize);

  // Paginate faculty
  const sortedFaculty = [...allFaculty].sort((a,b) => (a.name||"").localeCompare(b.name||""));
  const facultyTotalPages = Math.max(1, Math.ceil(sortedFaculty.length / facultyPageSize));
  const pagedFaculty = sortedFaculty.slice((facultyPage-1)*facultyPageSize, facultyPage*facultyPageSize);

  // Paginate students
  const studentTotalPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const pagedStudents = filteredStudents.slice((studentPage-1)*studentPageSize, studentPage*studentPageSize);

  React.useEffect(() => { setStudentPage(1); }, [selectedDeptForStudents, studentPageSize]);
  React.useEffect(() => { setAdminPage(1); }, [adminPageSize]);
  React.useEffect(() => { setFacultyPage(1); }, [facultyPageSize]);

  /* ── menu ── */
  const menuItems = [
    { label:"Dashboard",     icon:<DashboardIcon /> },
    { label:"Departments",   icon:<ApartmentIcon /> },
    { label:"AddAdmin",      icon:<PeopleIcon />,      display:"Add Admin" },
    { label:"Staff",         icon:<PeopleIcon />,      display:"Staff" },
    { label:"Students",      icon:<SchoolIcon />,      display:"Students" },
    { label:"SubjectsView",  icon:<BarChartIcon />,    display:"Subjects" },
    { label:"Announcements", icon:<AnnouncementIcon /> },
  ];

  const sidebarItemStyle = (item) => ({
    background: selectedItem === item ? "linear-gradient(90deg,#ffffff,#f1f5ff)" : "transparent",
    color: selectedItem === item ? "#1e3c72" : "#ffffff",
    margin:"8px 14px", borderRadius:"12px", transition:"all 0.3s ease",
    "&:hover": { background:"linear-gradient(90deg,#4facfe,#00f2fe)", color:"#ffffff", transform:"translateX(6px)" },
  });

  /* ── table header style ── */
  const thStyle = {
    padding:"12px 14px", textAlign:"left", color:"#475569",
    fontWeight:600, borderBottom:"1px solid #e2e8f0",
    fontSize:"12px", textTransform:"uppercase", letterSpacing:"0.4px",
  };

  /* ─────── RENDER ─────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html,body{height:auto!important;overflow-y:auto!important;overflow-x:hidden;font-family:'Inter','Segoe UI',sans-serif!important;}
        #root{height:auto!important;min-height:100vh;}
        *{font-family:'Inter','Segoe UI',sans-serif;}
        input:focus,select:focus,textarea:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,0.12);}
      `}</style>

      <Box sx={{ display:"flex", alignItems:"flex-start" }}>
        <CssBaseline />

        {/* AppBar */}
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => setOpen(true)} edge="start"
              sx={{ mr:2, ...(open && {display:"none"}) }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow:1, fontWeight:700 }}>Super Admin Dashboard</Typography>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer
          sx={{
            width:drawerWidth, flexShrink:0,
            "& .MuiDrawer-paper":{
              width:drawerWidth, boxSizing:"border-box",
              background:"linear-gradient(180deg,#1e3c72,#2a5298)", color:"#fff",
            },
          }}
          variant="persistent" anchor="left" open={open}
        >
          <DrawerHeader>
            <Typography sx={{ flexGrow:1, ml:1, color:"#fff", fontWeight:800, fontSize:"18px" }}>SLEA</Typography>
            <IconButton onClick={() => setOpen(false)} sx={{ color:"#fff" }}>
              {theme.direction==="ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider sx={{ borderColor:"rgba(255,255,255,0.2)" }} />
          <List>
            {menuItems.map(({ label, icon, display }) => (
              <ListItem disablePadding key={label}>
                <ListItemButton onClick={() => { setSelectedItem(label); setMsg(""); }} sx={sidebarItemStyle(label)}>
                  <ListItemIcon sx={{ color: selectedItem===label ? "#1e3c72" : "#fff" }}>{icon}</ListItemIcon>
                  <ListItemText primary={display || label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding onClick={handleLogout}>
              <ListItemButton sx={{
                margin:"8px 14px", borderRadius:"12px",
                "&:hover":{ background:"linear-gradient(90deg,#ff416c,#ff4b2b)", color:"#fff" },
              }}>
                <ListItemIcon sx={{ color:"#fff" }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* Main */}
        <Main open={open}>
          <DrawerHeader />

          {/* Edit Admin Modal */}
          {editingAdmin && (
            <EditAdminModal
              admin={editingAdmin}
              departments={departments}
              onClose={() => setEditingAdmin(null)}
              onSave={handleEditAdmin}
            />
          )}

          {/* Global message */}
          {msg && (
            <div style={{
              padding:"10px 16px", marginBottom:"16px", borderRadius:"8px",
              background: msg.startsWith("✅") ? "#dcfce7" : "#fee2e2",
              color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight:500,
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <span>{msg}</span>
              <button onClick={() => setMsg("")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"inherit" }}>✕</button>
            </div>
          )}

          {/* ══════════════ DASHBOARD ══════════════ */}
          {selectedItem === "Dashboard" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:3 }}>Welcome, Super Admin </Typography>

              {/* Top stat cards */}
              <div style={{ display:"flex", gap:"20px", marginBottom:"30px", flexWrap:"wrap" }}>
                <StatCard label="Total Students" value={stats.totalStudents} color="#2563eb" />
                <StatCard label="Total Admins"   value={stats.totalAdmins}   color="#d97706" />
                <StatCard label="Total Faculty"  value={allFaculty.length}   color="#7c3aed" />
                <StatCard label="Departments"    value={departments.length}   color="#0891b2" />
              </div>

              {/* Students per dept */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"24px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Students per Department</Typography>
                {stats.deptStats?.length > 0 ? (
                  <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                    {stats.deptStats.map(d => (
                      <div key={d.department} style={{
                        padding:"16px 28px", borderRadius:"10px", background:"#f8fafc",
                        border:`2px solid ${getDeptColor(d.department, departments)}`,
                        textAlign:"center", minWidth:"120px",
                      }}>
                        <p style={{ fontWeight:700, color:getDeptColor(d.department, departments), fontSize:"28px" }}>{d.count}</p>
                        <p style={{ color:"#475569", fontSize:"13px", marginTop:"4px" }}>{d.department}</p>
                        <p style={{ color:"#94a3b8", fontSize:"11px" }}>students</p>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color:"#94a3b8" }}>No department data yet.</p>}
              </div>

              {/* ── NEW: Dept Performance Categories ── */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"24px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Student Performance by Department</Typography>
                {Object.keys(deptPerfCounts).length > 0 ? (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          <th style={thStyle}>Department</th>
                          {PERF_BANDS.map(b => (
                            <th key={b.key} style={{ ...thStyle, color:b.color }}>
                              <span style={{ background:b.bg, color:b.color, padding:"3px 10px", borderRadius:"20px" }}>{b.key}</span>
                            </th>
                          ))}
                          <th style={thStyle}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map((d, i) => {
                          const data = deptPerfCounts[d.name] || {};
                          const total = PERF_BANDS.reduce((s, b) => s + (data[b.key] || 0), 0);
                          return (
                            <tr key={d.name} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#f8fafc" }}>
                              <td style={{ padding:"12px 14px" }}><DeptBadge dept={d.name} departments={departments} /></td>
                              {PERF_BANDS.map(b => (
                                <td key={b.key} style={{ padding:"12px 14px", textAlign:"center" }}>
                                  <span style={{ fontWeight:700, color:b.color, fontSize:"16px" }}>{data[b.key] || 0}</span>
                                </td>
                              ))}
                              <td style={{ padding:"12px 14px", textAlign:"center", fontWeight:600, color:"#475569" }}>{total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color:"#94a3b8" }}>No performance data yet. Admins need to add skills/activities for students.</p>
                )}
              </div>

              {/* Faculty per dept */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"24px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Faculty per Department</Typography>
                {allFaculty.length > 0 ? (
                  <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                    {departments.map(d => {
                      const count = allFaculty.filter(f => f.department===d.name).length;
                      const color = getDeptColor(d.name, departments);
                      return (
                        <div key={d.name} style={{ padding:"16px 28px", borderRadius:"10px", background:"#f5f3ff", border:`2px solid ${color}`, textAlign:"center", minWidth:"120px" }}>
                          <p style={{ fontWeight:700, color, fontSize:"28px" }}>{count}</p>
                          <p style={{ color:"#475569", fontSize:"13px", marginTop:"4px" }}>{d.name}</p>
                          <p style={{ color:"#94a3b8", fontSize:"11px" }}>faculty</p>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color:"#94a3b8" }}>No faculty added yet.</p>}
              </div>

              {/* Admins per dept */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"24px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Admins per Department</Typography>
                {adminByDept.length > 0 ? (
                  <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                    {adminByDept.map(d => (
                      <div key={d.department} style={{
                        padding:"16px 24px", borderRadius:"10px",
                        background: getDeptColor(d.department, departments)+"15",
                        border:`2px solid ${getDeptColor(d.department, departments)}`,
                        textAlign:"center", minWidth:"110px",
                      }}>
                        <p style={{ fontWeight:700, color:getDeptColor(d.department, departments), fontSize:"26px" }}>{d.count}</p>
                        <p style={{ color:"#475569", fontSize:"13px", marginTop:"4px" }}>{d.department}</p>
                        <p style={{ color:"#94a3b8", fontSize:"11px" }}>admin(s)</p>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color:"#94a3b8" }}>No admin data yet.</p>}
              </div>

              {/* Avg efficiency per dept */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"24px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Average Efficiency Score per Department</Typography>
                {deptEfficiency.length > 0 ? (
                  <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                    {deptEfficiency.map(d => {
                      const color = getDeptColor(d.department, departments);
                      const band  = getBand(d.avgEfficiency);
                      return (
                        <div key={d.department} style={{
                          padding:"18px 24px", borderRadius:"12px", background:"#f8fafc",
                          border:`2px solid ${color}`, textAlign:"center", minWidth:"130px",
                        }}>
                          <p style={{ fontWeight:700, color, fontSize:"13px", marginBottom:"6px" }}>{d.department}</p>
                          <p style={{ fontWeight:800, color:band.color, fontSize:"32px", lineHeight:1 }}>{d.avgEfficiency}</p>
                          <p style={{ fontSize:"10px", color:"#94a3b8", marginTop:"4px" }}>avg / 100</p>
                          <span style={{ display:"inline-block", marginTop:"6px", padding:"2px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:600, background:band.bg, color:band.color }}>{band.key}</span>
                          <p style={{ fontSize:"10px", color:"#94a3b8", marginTop:"4px" }}>{d.studentCount} student{d.studentCount!==1?"s":""}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color:"#94a3b8" }}>No efficiency data yet.</p>}
              </div>
            </Box>
          )}

          {/* ══════════════ DEPARTMENTS ══════════════ */}
          {selectedItem === "Departments" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:3 }}>Manage Departments</Typography>
              <div style={{ background:"#fff", borderRadius:"12px", padding:"28px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", maxWidth:"460px", marginBottom:"32px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Add New Department</Typography>
                <input style={inputStyle} placeholder="Department name (e.g. ECE, MBA)"
                  value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleAddDepartment()} />
                <button style={btnStyle} onClick={handleAddDepartment}>➕ Add Department</button>
              </div>
              <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>All Departments ({departments.length})</Typography>
              <div style={{ background:"#fff", borderRadius:"12px", padding:"16px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", maxWidth:"600px" }}>
                {departments.length === 0 ? (
                  <p style={{ color:"#94a3b8", textAlign:"center", padding:"20px" }}>No departments yet.</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    {departments.map((d, i) => (
                      <div key={d.id || d.name} style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"12px 16px", borderRadius:"10px", background:"#f8fafc", border:"1px solid #e2e8f0",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                          <span style={{ width:"10px", height:"10px", borderRadius:"50%", background:DEPT_PALETTE[i%DEPT_PALETTE.length], display:"inline-block" }} />
                          <span style={{ fontWeight:600, fontSize:"15px" }}>{d.name}</span>
                          <span style={{ fontSize:"12px", color:"#94a3b8" }}>
                            {allStudents.filter(s => s.department===d.name).length} students •{" "}
                            {allFaculty.filter(f => f.department===d.name).length} faculty
                          </span>
                        </div>
                        <IconButton size="small" sx={{ color:"#ef4444" }} onClick={() => handleDeleteDepartment(d.name)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Box>
          )}

          {/* ══════════════ ADD ADMIN ══════════════ */}
          {selectedItem === "AddAdmin" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:3 }}>Manage Admins</Typography>

              {/* Add form */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"28px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", maxWidth:"520px", marginBottom:"32px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>➕ Add New Admin</Typography>

                {[
                  { key:"name",     placeholder:"Full Name *",        type:"text"     },
                  { key:"email",    placeholder:"Email Address *",    type:"email"    },
                  { key:"password", placeholder:"Password (min 6) *", type:"password" },
                  { key:"phone",    placeholder:"Phone Number (10 digits) *", type:"tel" },
                ].map(f => (
                  <div key={f.key}>
                    <input
                      style={{ ...inputStyle, borderColor: adminFormErrors[f.key] ? "#ef4444" : "#cbd5e1", marginBottom:"4px" }}
                      placeholder={f.placeholder} type={f.type}
                      value={adminForm[f.key]}
                      onChange={e => { setAdminForm({...adminForm, [f.key]:e.target.value}); setAdminFormErrors(prev => ({...prev, [f.key]:""})); }}
                    />
                    {adminFormErrors[f.key] && <p style={{ color:"#ef4444", fontSize:"12px", marginBottom:"10px", marginTop:"0" }}>⚠ {adminFormErrors[f.key]}</p>}
                  </div>
                ))}

                <div>
                  <select
                    style={{ ...inputStyle, background:"#fff", cursor:"pointer", borderColor: adminFormErrors.department ? "#ef4444":"#cbd5e1", marginBottom:"4px" }}
                    value={adminForm.department}
                    onChange={e => { setAdminForm({...adminForm, department:e.target.value}); setAdminFormErrors(prev => ({...prev, department:""})); }}
                  >
                    {departments.length===0
                      ? <option value="">— No departments yet —</option>
                      : departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)
                    }
                  </select>
                  {adminFormErrors.department && <p style={{ color:"#ef4444", fontSize:"12px", marginBottom:"10px" }}>⚠ {adminFormErrors.department}</p>}
                </div>

                {departments.length===0 && (
                  <p style={{ color:"#f59e0b", fontSize:"13px", marginBottom:"10px" }}>⚠️ Add departments first.</p>
                )}
                <button style={btnStyle} onClick={handleAddAdmin} disabled={departments.length===0}>➕ Add Admin</button>
              </div>

              {/* Admin table */}
              <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>All Admins ({admins.length})</Typography>
              <div style={{ background:"#fff", borderRadius:"12px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", overflowX:"auto", marginBottom:"40px" }}>
                {admins.length === 0 ? (
                  <p style={{ color:"#94a3b8", textAlign:"center", padding:"20px" }}>No admins yet.</p>
                ) : (
                  <>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                      <thead>
                        <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)", color:"#fff" }}>
                          {["#","Name","Email","Phone","Department","Status","Last Active / Left","Actions"].map(h => (
                            <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontWeight:600, fontSize:"12px", textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedAdmins.map((a, i) => (
                          <tr key={a.id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#f8fafc", opacity: a.is_active===0 ? 0.7 : 1 }}>
                            <td style={{ padding:"12px 14px", color:"#94a3b8" }}>{(adminPage-1)*adminPageSize + i + 1}</td>
                            <td style={{ padding:"12px 14px", fontWeight:600 }}>{a.name}</td>
                            <td style={{ padding:"12px 14px", color:"#475569" }}>{a.email}</td>
                            <td style={{ padding:"12px 14px", color:"#475569" }}>
                              {a.phone ? (
                                <a href={`tel:${a.phone}`} style={{ color:"#2563eb", textDecoration:"none", fontWeight:500 }}>📞 {a.phone}</a>
                              ) : <span style={{ color:"#94a3b8" }}>—</span>}
                            </td>
                            <td style={{ padding:"12px 14px" }}><DeptBadge dept={a.department} departments={departments} /></td>
                            <td style={{ padding:"12px 14px" }}><StatusBadge active={a.is_active !== 0} /></td>
                            <td style={{ padding:"12px 14px", color:"#64748b", fontSize:"12px" }}>
                              {a.is_active===0 && a.left_date
                                ? <>Left: {new Date(a.left_date).toLocaleDateString()}</>
                                : a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"
                              }
                            </td>
                            <td style={{ padding:"12px 14px" }}>
                              <div style={{ display:"flex", gap:"6px" }}>
                                <IconButton size="small" sx={{ color:"#2563eb" }} onClick={() => setEditingAdmin(a)} title="Edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <button
                                  onClick={() => handleToggleAdminStatus(a)}
                                  style={{
                                    ...btnSmStyle, fontSize:"11px", padding:"4px 10px",
                                    background: a.is_active!==0 ? "#fee2e2" : "#dcfce7",
                                    color: a.is_active!==0 ? "#dc2626" : "#16a34a",
                                  }}
                                >
                                  {a.is_active!==0 ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationBar
                      page={adminPage} totalPages={adminTotalPages}
                      pageSize={adminPageSize} setPage={setAdminPage} setPageSize={size => { setAdminPageSize(size); setAdminPage(1); }}
                      total={admins.length}
                    />
                  </>
                )}
              </div>
            </Box>
          )}

          {/* ══════════════ STAFF ══════════════ */}
          {selectedItem === "Staff" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:3 }}>Staff Directory</Typography>

              {/* Faculty */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"28px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Faculty Members ({allFaculty.length})</Typography>
                {allFaculty.length === 0 ? (
                  <p style={{ color:"#94a3b8" }}>No faculty added yet.</p>
                ) : (
                  <>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                        <thead>
                          <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)", color:"#fff" }}>
                            {["#","Name","Email","Department","Phone"].map(h => (
                              <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, fontSize:"12px", textTransform:"uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pagedFaculty.map((f, i) => (
                            <tr key={f.id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#f8fafc" }}>
                              <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{(facultyPage-1)*facultyPageSize + i + 1}</td>
                              <td style={{ padding:"12px 16px", fontWeight:600 }}>{f.name}</td>
                              <td style={{ padding:"12px 16px", color:"#475569" }}>{f.email}</td>
                              <td style={{ padding:"12px 16px" }}><DeptBadge dept={f.department} departments={departments} /></td>
                              <td style={{ padding:"12px 16px", color:"#475569" }}>
                                {f.phone
                                  ? <a href={`tel:${f.phone}`} style={{ color:"#2563eb", textDecoration:"none", fontWeight:500 }}>📞 {f.phone}</a>
                                  : <span style={{ color:"#94a3b8" }}>—</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      page={facultyPage} totalPages={facultyTotalPages}
                      pageSize={facultyPageSize} setPage={setFacultyPage} setPageSize={size => { setFacultyPageSize(size); setFacultyPage(1); }}
                      total={allFaculty.length}
                    />
                  </>
                )}
              </div>

              {/* Admins in staff view */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"28px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Admin Members ({admins.length})</Typography>
                {admins.length === 0 ? (
                  <p style={{ color:"#94a3b8" }}>No admins yet.</p>
                ) : (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                      <thead>
                        <tr style={{ background:"linear-gradient(90deg,#141E30,#243B55)", color:"#fff" }}>
                          {["#","Name","Email","Department","Phone","Status"].map(h => (
                            <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, fontSize:"12px", textTransform:"uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...admins].sort((a,b) => (a.name||"").localeCompare(b.name||"")).map((a, i) => (
                          <tr key={a.id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#f8fafc", opacity: a.is_active===0?0.7:1 }}>
                            <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{i+1}</td>
                            <td style={{ padding:"12px 16px", fontWeight:600 }}>{a.name}</td>
                            <td style={{ padding:"12px 16px", color:"#475569" }}>{a.email}</td>
                            <td style={{ padding:"12px 16px" }}><DeptBadge dept={a.department} departments={departments} /></td>
                            <td style={{ padding:"12px 16px", color:"#475569" }}>
                              {a.phone
                                ? <a href={`tel:${a.phone}`} style={{ color:"#2563eb", textDecoration:"none", fontWeight:500 }}>📞 {a.phone}</a>
                                : <span style={{ color:"#94a3b8" }}>—</span>
                              }
                            </td>
                            <td style={{ padding:"12px 16px" }}><StatusBadge active={a.is_active!==0} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Box>
          )}

          {/* ══════════════ STUDENTS (dept-wise view only) ══════════════ */}
          {selectedItem === "Students" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:1 }}>Student Information</Typography>
              <Typography sx={{ color:"#64748b", mb:3, fontSize:"14px" }}>
                View students department-wise. Select a department to see its students.
              </Typography>

              {/* Dept selector */}
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"24px" }}>
                {departments.map(d => {
                  const color = getDeptColor(d.name, departments);
                  const count = allStudents.filter(s => s.department===d.name).length;
                  const active = selectedDeptForStudents === d.name;
                  return (
                    <button key={d.name} onClick={() => setSelectedDeptForStudents(d.name)} style={{
                      padding:"10px 20px", borderRadius:"10px", cursor:"pointer", fontWeight:600, fontSize:"14px",
                      border:`2px solid ${color}`,
                      background: active ? color : "#fff",
                      color: active ? "#fff" : color,
                      transition:"all 0.2s",
                    }}>
                      {d.name} <span style={{ fontWeight:400, fontSize:"12px", opacity:0.8 }}>({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Student table */}
              {!selectedDeptForStudents ? (
                <div style={{ background:"#fff", borderRadius:"12px", padding:"40px", textAlign:"center", boxShadow:"0 4px 14px rgba(0,0,0,0.08)" }}>
                  <p style={{ fontSize:"32px", marginBottom:"12px" }}>🏫</p>
                  <p style={{ color:"#94a3b8", fontSize:"16px" }}>Select a department above to view its students.</p>
                </div>
              ) : (
                <div style={{ background:"#fff", borderRadius:"12px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <Typography variant="h6" sx={{ fontWeight:700 }}>
                      <DeptBadge dept={selectedDeptForStudents} departments={departments} />
                      <span style={{ marginLeft:"10px", color:"#475569" }}>— {filteredStudents.length} students</span>
                    </Typography>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <p style={{ color:"#94a3b8", padding:"24px", textAlign:"center" }}>No students in this department yet.</p>
                  ) : (
                    <>
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                          <thead>
                            <tr style={{ background:"linear-gradient(90deg,#1e3c72,#2a5298)", color:"#fff" }}>
                              {["#","Name","Roll No","Email","Phone","Department"].map(h => (
                                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:600, fontSize:"12px", textTransform:"uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pagedStudents.map((s, i) => (
                              <tr key={s.id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#f8fafc" }}>
                                <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{(studentPage-1)*studentPageSize + i + 1}</td>
                                <td style={{ padding:"12px 16px", fontWeight:600 }}>{s.name}</td>
                                <td style={{ padding:"12px 16px", color:"#2563eb", fontWeight:500 }}>{s.rollno}</td>
                                <td style={{ padding:"12px 16px", color:"#475569" }}>{s.email}</td>
                                <td style={{ padding:"12px 16px", color:"#475569" }}>
                                  {s.phone
                                    ? <a href={`tel:${s.phone}`} style={{ color:"#2563eb", textDecoration:"none", fontWeight:500 }}>📞 {s.phone}</a>
                                    : <span style={{ color:"#94a3b8" }}>—</span>
                                  }
                                </td>
                                <td style={{ padding:"12px 16px" }}><DeptBadge dept={s.department} departments={departments} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationBar
                        page={studentPage} totalPages={studentTotalPages}
                        pageSize={studentPageSize} setPage={setStudentPage} setPageSize={size => { setStudentPageSize(size); setStudentPage(1); }}
                        total={filteredStudents.length}
                      />
                    </>
                  )}
                </div>
              )}
            </Box>
          )}

          {/* ══════════════ SUBJECTS VIEW ══════════════ */}
          {selectedItem === "SubjectsView" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:1 }}>Subjects by Department</Typography>
              <Typography sx={{ color:"#64748b", mb:3, fontSize:"14px" }}>
                Total: {allSubjects.length} subjects across all departments.
              </Typography>

              {/* Summary cards */}
              <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"28px" }}>
                <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Subjects per Department</Typography>
                {departments.length > 0 ? (
                  <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                    {departments.map(d => {
                      const count = allSubjects.filter(s => s.department===d.name).length;
                      const color = getDeptColor(d.name, departments);
                      return (
                        <div key={d.name} style={{ padding:"16px 28px", borderRadius:"10px", background:"#f8fafc", border:`2px solid ${color}`, textAlign:"center", minWidth:"120px" }}>
                          <p style={{ fontWeight:700, color, fontSize:"28px" }}>{count}</p>
                          <p style={{ color:"#475569", fontSize:"13px", marginTop:"4px" }}>{d.name}</p>
                          <p style={{ color:"#94a3b8", fontSize:"11px" }}>subjects</p>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color:"#94a3b8" }}>No departments yet.</p>}
              </div>

              {/* Per-dept subject breakdown */}
              {departments.map(d => {
                const deptSubs = allSubjects.filter(s => s.department===d.name);
                if (deptSubs.length === 0) return null;
                const color = getDeptColor(d.name, departments);
                const SEMESTERS = ["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"];
                return (
                  <div key={d.name} style={{ background:"#fff", borderRadius:"12px", padding:"24px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", marginBottom:"20px", borderTop:`4px solid ${color}` }}>
                    <Typography variant="h6" sx={{ fontWeight:700, mb:2, color }}>
                      {d.name} <span style={{ color:"#94a3b8", fontWeight:400, fontSize:"14px" }}>— {deptSubs.length} subjects</span>
                    </Typography>
                    <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                      {SEMESTERS.map(sem => {
                        const semSubs = deptSubs.filter(s => s.semester===sem);
                        if (semSubs.length === 0) return null;
                        return (
                          <div key={sem}>
                            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                              <span style={{ background:color, color:"#fff", borderRadius:"6px", padding:"3px 12px", fontSize:"12px", fontWeight:700 }}>{sem}</span>
                              <span style={{ color:"#94a3b8", fontSize:"12px" }}>{semSubs.length} subject{semSubs.length!==1?"s":""}</span>
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                              {semSubs.map(s => (
                                <span key={s.id||s.subject_name} style={{
                                  background:color+"15", border:`1px solid ${color}40`,
                                  color:"#1e293b", borderRadius:"8px", padding:"6px 14px", fontSize:"13px", fontWeight:500,
                                }}>
                                  {s.subject_name}
                                  {s.credits && <span style={{ color:"#94a3b8", fontSize:"11px", marginLeft:"6px" }}>{s.credits}cr</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {allSubjects.length === 0 && departments.length > 0 && (
                <p style={{ color:"#94a3b8" }}>No subjects added yet. Admins can add subjects from their dashboard.</p>
              )}
            </Box>
          )}

          {/* ══════════════ ANNOUNCEMENTS ══════════════ */}
          {selectedItem === "Announcements" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight:"bold", mb:3 }}>Announcements</Typography>

              <div style={{ background:"#fff", borderRadius:"12px", padding:"28px", boxShadow:"0 4px 14px rgba(0,0,0,0.08)", maxWidth:"560px", marginBottom:"32px" }}>
                <input style={inputStyle} placeholder="Title *" value={annForm.title} onChange={e => setAnnForm({...annForm, title:e.target.value})} />
                <textarea
                  style={{ ...inputStyle, height:"100px", resize:"vertical", fontFamily:"inherit" }}
                  placeholder="Message…" value={annForm.message}
                  onChange={e => setAnnForm({...annForm, message:e.target.value})}
                />
                <select style={{ ...inputStyle, background:"#fff", cursor:"pointer" }} value={annForm.target} onChange={e => setAnnForm({...annForm, target:e.target.value})}>
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d.name} value={d.name}>{d.name} Only</option>)}
                </select>
                <button style={btnStyle} onClick={handleAddAnnouncement}>📢 Post Announcement</button>
              </div>

              <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>Posted Announcements ({announcements.length})</Typography>
              {announcements.length === 0 ? (
                <p style={{ color:"#94a3b8" }}>No announcements yet.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px", paddingBottom:"40px" }}>
                  {announcements.map(a => (
                    <div key={a.id} style={{
                      background:"#fff", borderRadius:"12px", padding:"20px 24px",
                      boxShadow:"0 4px 14px rgba(0,0,0,0.06)",
                      borderLeft:`5px solid ${getDeptColor(a.target, departments)}`,
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                          <DeptBadge dept={a.target==="all"?"All":a.target} departments={departments} />
                          <span style={{ fontSize:"12px", color:"#94a3b8" }}>
                            {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                        <IconButton size="small" sx={{ color:"#ef4444" }} onClick={() => handleDeleteAnn(a.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                      <p style={{ fontWeight:700, fontSize:"16px", marginBottom:"4px" }}>{a.title}</p>
                      <p style={{ color:"#475569", marginBottom:"12px", fontSize:"14px" }}>{a.message}</p>

                      {(replies[a.id]||[]).length > 0 && (
                        <div style={{ marginBottom:"12px", paddingLeft:"12px", borderLeft:"2px solid #e2e8f0" }}>
                          {(replies[a.id]||[]).map((r, i) => (
                            <div key={i} style={{ background:"#f8fafc", borderRadius:"8px", padding:"8px 12px", marginBottom:"6px" }}>
                              <span style={{ fontSize:"12px", color:"#2563eb", fontWeight:600 }}>
                                {r.user_name||"User"}
                                {r.is_voice===1 && <span style={{ color:"#7c3aed", marginLeft:"6px", fontSize:"10px" }}>🎤 voice</span>}
                              </span>
                              <p style={{ fontSize:"13px", color:"#475569", marginTop:"2px" }}>{r.reply_text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                        <input
                          style={{ flex:1, padding:"9px 14px", fontSize:"13px", border:"1px solid #e2e8f0", borderRadius:"8px", outline:"none" }}
                          placeholder="Write a reply…"
                          value={replyText[a.id]||""}
                          onChange={e => setReplyText(prev => ({...prev, [a.id]:e.target.value}))}
                          onKeyDown={e => e.key==="Enter" && submitReply(a.id, false)}
                        />
                        <button onClick={() => startVoice(a.id)} style={{
                          padding:"9px 11px", border:"1px solid #e2e8f0", borderRadius:"8px",
                          cursor:"pointer", fontSize:"15px",
                          background: isListening===a.id ? "#fee2e2" : "#f8fafc",
                        }}>🎤</button>
                        <button onClick={() => submitReply(a.id, false)} style={{
                          padding:"9px 18px", background:"#2563eb", color:"#fff",
                          border:"none", borderRadius:"8px", fontWeight:600, fontSize:"13px", cursor:"pointer",
                        }}>Reply</button>
                      </div>
                      {isListening===a.id && (
                        <p style={{ color:"#ef4444", fontSize:"12px", marginTop:"6px" }}>🎤 Listening… speak now</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Box>
          )}

        </Main>
      </Box>
    </>
  );
}