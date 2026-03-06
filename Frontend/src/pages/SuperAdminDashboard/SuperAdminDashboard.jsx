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
import DeleteIcon from "@mui/icons-material/Delete";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BarChartIcon from "@mui/icons-material/BarChart";

const drawerWidth = 240;

/* ─────────────────────────────────────────
   MUI STYLED COMPONENTS
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const DEPT_PALETTE = [
  "#2563eb","#d97706","#16a34a","#b03e17","#7c3aed",
  "#0891b2","#db2777","#65a30d","#ea580c","#0f766e",
];

const inputStyle = {
  width: "100%", padding: "10px 14px", fontSize: "15px",
  borderRadius: "8px", border: "1px solid #cbd5e1",
  outline: "none", marginBottom: "12px", boxSizing: "border-box",
};

const btnStyle = {
  padding: "11px 24px",
  background: "linear-gradient(90deg,#1e3c72,#2a5298)",
  color: "#fff", border: "none", borderRadius: "8px",
  fontSize: "15px", cursor: "pointer", marginTop: "4px",
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getDeptColor(name, departments) {
  const idx = departments.findIndex((d) => d.name === name);
  return DEPT_PALETTE[idx % DEPT_PALETTE.length] || "#64748b";
}

function StatCard({ label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, background: "#fff", borderRadius: "12px", padding: "24px",
      textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      borderTop: `4px solid ${color}`,
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.15s",
    }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = "translateY(-3px)")}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = "none")}
    >
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "32px", fontWeight: "bold", color }}>{value}</p>
      {onClick && <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Click to view breakdown</p>}
    </div>
  );
}

function DeptBadge({ dept, departments = [] }) {
  const color = getDeptColor(dept, departments);
  return (
    <span style={{
      background: color, color: "#fff", padding: "3px 10px",
      borderRadius: "20px", fontSize: "12px", fontWeight: 600,
    }}>
      {dept}
    </span>
  );
}

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const theme    = useTheme();
  const navigate = useNavigate();

  const [open,         setOpen]         = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState("Dashboard");
  const [msg,          setMsg]          = React.useState("");

  // ── Data ──────────────────────────────
  const [stats,         setStats]         = React.useState({ totalStudents: 0, totalAdmins: 0, totalMarks: 0, deptStats: [] });
  const [admins,        setAdmins]        = React.useState([]);
  const [departments,   setDepartments]   = React.useState([]);
  const [announcements, setAnnouncements] = React.useState([]);
  const [replies,       setReplies]       = React.useState({});    
  const [adminByDept,   setAdminByDept]   = React.useState([]);    
  const [marksByDept,   setMarksByDept]   = React.useState([]);     
  const [deptMarksDetail, setDeptMarksDetail] = React.useState(null); 

  // ── Forms ─────────────────────────────
  const [adminForm, setAdminForm] = React.useState({ name: "", email: "", password: "", department: "" });
  const [annForm,   setAnnForm]   = React.useState({ title: "", message: "", target: "all" });
  const [newDeptName, setNewDeptName] = React.useState("");

  // ── Reply state ───────────────────────
  const [replyText,   setReplyText]   = React.useState({});
  const [isListening, setIsListening] = React.useState(null);

  /* ─────────────────────────────────────
     AUTH
  ───────────────────────────────────── */
  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  /* ─────────────────────────────────────
     INIT
  ───────────────────────────────────── */
  React.useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchAll();
  }, []);

  React.useEffect(() => {
    if (departments.length > 0 && !adminForm.department) {
      setAdminForm((prev) => ({ ...prev, department: departments[0].name }));
    }
  }, [departments]);

  const fetchAll = () => {
    fetchStats();
    fetchAdmins();
    fetchAnnouncements();
    fetchDepartments();
    fetchAdminByDept();
    fetchMarksByDept();
  };

  /* ─────────────────────────────────────
     FETCH
  ───────────────────────────────────── */
  const fetchStats = async () => {
    try {
      const res  = await fetch("http://localhost:5000/superadmin/stats", { headers: getAuthHeader() });
      if (res.status === 401) { localStorage.clear(); navigate("/"); return; }
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error("fetchStats:", err); }
  };

  const fetchAdmins = async () => {
    try {
      const res  = await fetch("http://localhost:5000/superadmin/admins", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchAdmins:", err); }
  };

  const fetchDepartments = async () => {
    try {
      const res  = await fetch("http://localhost:5000/superadmin/departments", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchDepartments:", err); }
  };

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

  const fetchReplies = async (annId) => {
    try {
      const res  = await fetch(`http://localhost:5000/announcement/${annId}/replies`, { headers: getAuthHeader() });
      const data = await res.json();
      setReplies((prev) => ({ ...prev, [annId]: Array.isArray(data) ? data : [] }));
    } catch (err) { console.error("fetchReplies:", err); }
  };

  /* ✅ NEW: admin count per dept */
  const fetchAdminByDept = async () => {
    try {
      const res  = await fetch("http://localhost:5000/superadmin/admin-by-dept", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setAdminByDept(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchAdminByDept:", err); }
  };

  /* ✅ NEW: marks summary by dept */
  const fetchMarksByDept = async () => {
    try {
      const res  = await fetch("http://localhost:5000/superadmin/marks-by-dept", { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setMarksByDept(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchMarksByDept:", err); }
  };

  /* ✅ NEW: drill-down — click dept to see all marks */
  const fetchDeptMarksDetail = async (dept) => {
    try {
      const res  = await fetch(`http://localhost:5000/superadmin/marks-by-dept?dept=${dept}`, { headers: getAuthHeader() });
      if (!res.ok) return;
      const data = await res.json();
      setDeptMarksDetail({ dept, rows: Array.isArray(data) ? data : [] });
      setSelectedItem("MarksDetail");
    } catch (err) { console.error("fetchDeptMarksDetail:", err); }
  };

  /* ─────────────────────────────────────
     ACTIONS
  ───────────────────────────────────── */
  const handleAddDepartment = async () => {
    const name = newDeptName.trim();
    if (!name) { setMsg("❌ Department name required"); return; }
    try {
      const res  = await fetch("http://localhost:5000/superadmin/department", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
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
      const res = await fetch(`http://localhost:5000/superadmin/department/${encodeURIComponent(name)}`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) { setMsg("❌ Failed to delete department"); return; }
      setMsg(`✅ Department '${name}' removed`);
      fetchDepartments();
    } catch (err) { console.error(err); }
  };

  const handleAddAdmin = async () => {
    const { name, email, password, department } = adminForm;
    if (!name || !email || !password || !department) { setMsg("❌ All fields required"); return; }
    try {
      const res  = await fetch("http://localhost:5000/superadmin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ name, email, password, department }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg(`✅ ${data.message}`);
      setAdminForm({ name: "", email: "", password: "", department: departments[0]?.name || "" });
      fetchAdmins();
      fetchStats();
      fetchAdminByDept();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Remove this admin?")) return;
    try {
      const res = await fetch(`http://localhost:5000/superadmin/admin/${id}`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) { setMsg("❌ Failed to delete admin"); return; }
      fetchAdmins();
      fetchStats();
      fetchAdminByDept();
    } catch (err) { console.error(err); }
  };

  const handleAddAnnouncement = async () => {
    const { title, message, target } = annForm;
    if (!title || !message) { setMsg("❌ Title and message required"); return; }
    try {
      const res  = await fetch("http://localhost:5000/superadmin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ title, message, target }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg("✅ Announcement posted!");
      setAnnForm({ title: "", message: "", target: "all" });
      fetchAnnouncements();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteAnn = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/superadmin/announcement/${id}`, {
        method: "DELETE", headers: getAuthHeader(),
      });
      if (!res.ok) return;
      fetchAnnouncements();
    } catch (err) { console.error(err); }
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
      setReplyText((prev) => ({ ...prev, [annId]: e.results[0][0].transcript }));
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
      setReplyText((prev) => ({ ...prev, [annId]: "" }));
      fetchReplies(annId);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  /* ─────────────────────────────────────
     SIDEBAR ITEMS
  ───────────────────────────────────── */
  const menuItems = [
    { label: "Dashboard",     icon: <DashboardIcon />    },
    { label: "Departments",   icon: <ApartmentIcon />    },
    { label: "AddAdmin",      icon: <PeopleIcon />,       display: "Add Admin" },
    { label: "Announcements", icon: <AnnouncementIcon /> },
    { label: "MarksReport",   icon: <BarChartIcon />,     display: "Marks Report" }, // ✅ NEW
  ];

  const sidebarItemStyle = (item) => ({
    background:
      selectedItem === item
        ? "linear-gradient(90deg,#ffffff,#f1f5ff)"
        : "transparent",
    color: selectedItem === item ? "#1e3c72" : "#ffffff",
    margin: "8px 14px", borderRadius: "12px",
    transition: "all 0.3s ease",
    "&:hover": {
      background: "linear-gradient(90deg,#4facfe,#00f2fe)",
      color: "#ffffff", transform: "translateX(6px)",
    },
  });

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; overflow-x: hidden; }
        #root { height: auto !important; min-height: 100vh; }
      `}</style>

      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <CssBaseline />

        {/* ══════════ AppBar ══════════ */}
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => setOpen(true)} edge="start"
              sx={{ mr: 2, ...(open && { display: "none" }) }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Super Admin Dashboard</Typography>
          </Toolbar>
        </AppBar>

        {/* ══════════ Drawer ══════════ */}
        <Drawer
          sx={{
            width: drawerWidth, flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth, boxSizing: "border-box",
              background: "linear-gradient(180deg,#1e3c72,#2a5298)", color: "#fff",
            },
          }}
          variant="persistent" anchor="left" open={open}
        >
          <DrawerHeader>
            <Typography sx={{ flexGrow: 1, ml: 1, color: "#fff", fontWeight: 700 }}>SLEA</Typography>
            <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}>
              {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

          <List>
            {menuItems.map(({ label, icon, display }) => (
              <ListItem disablePadding key={label}>
                <ListItemButton onClick={() => { setSelectedItem(label); setMsg(""); }} sx={sidebarItemStyle(label)}>
                  <ListItemIcon sx={{ color: selectedItem === label ? "#1e3c72" : "#fff" }}>{icon}</ListItemIcon>
                  <ListItemText primary={display || label} />
                </ListItemButton>
              </ListItem>
            ))}

            <ListItem disablePadding onClick={handleLogout}>
              <ListItemButton sx={{
                margin: "8px 14px", borderRadius: "12px",
                "&:hover": { background: "linear-gradient(90deg,#ff416c,#ff4b2b)", color: "#fff" },
              }}>
                <ListItemIcon sx={{ color: "#fff" }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* ══════════ Main ══════════ */}
        <Main open={open}>
          <DrawerHeader />

          {/* Global message */}
          {msg && (
            <div style={{
              padding: "10px 16px", marginBottom: "16px", borderRadius: "8px",
              background: msg.startsWith("✅") ? "#dcfce7" : "#fee2e2",
              color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 500,
            }}>
              {msg}
            </div>
          )}

          {/* ════ DASHBOARD ════ */}
          {selectedItem === "Dashboard" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Welcome, Super Admin </Typography>

              {/* Top stat cards */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
                <StatCard label="Total Students"      value={stats.totalStudents} color="#2563eb" />
                <StatCard label="Total Admins"        value={stats.totalAdmins}   color="#d97706" />
                {/* ✅ CLICKABLE: Total Marks Entries → goes to Marks Report */}
                <StatCard
                  label="Total Marks Entries"
                  value={stats.totalMarks}
                  color="#16a34a"
                  onClick={() => setSelectedItem("MarksReport")}
                />
              </div>

              {/* ✅ NEW: Student count per department */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Students per Department</Typography>
                {stats.deptStats?.length > 0 ? (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {stats.deptStats.map((d) => (
                      <div key={d.department} style={{
                        padding: "16px 28px", borderRadius: "10px", background: "#f8fafc",
                        border: `2px solid ${getDeptColor(d.department, departments)}`,
                        textAlign: "center", minWidth: "120px",
                      }}>
                        <p style={{ fontWeight: 700, color: getDeptColor(d.department, departments), fontSize: "28px" }}>{d.count}</p>
                        <p style={{ color: "#475569", fontSize: "13px", marginTop: "4px" }}>{d.department}</p>
                        <p style={{ color: "#94a3b8", fontSize: "11px" }}>students</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8" }}>No department data yet.</p>
                )}
              </div>

              {/* ✅ NEW: Admin count per department */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", marginBottom: "24px" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Admins per Department</Typography>
                {adminByDept.length > 0 ? (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {adminByDept.map((d) => (
                      <div key={d.department} style={{
                        padding: "16px 24px", borderRadius: "10px",
                        background: getDeptColor(d.department, departments) + "15",
                        border: `2px solid ${getDeptColor(d.department, departments)}`,
                        textAlign: "center", minWidth: "110px",
                      }}>
                        <p style={{ fontWeight: 700, color: getDeptColor(d.department, departments), fontSize: "26px" }}>{d.count}</p>
                        <p style={{ color: "#475569", fontSize: "13px", marginTop: "4px" }}>{d.department}</p>
                        <p style={{ color: "#94a3b8", fontSize: "11px" }}>admin(s)</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8" }}>No admin data yet.</p>
                )}
              </div>
            </Box>
          )}

          {/* ════ DEPARTMENTS ════ */}
          {selectedItem === "Departments" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Manage Departments</Typography>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "460px", marginBottom: "32px" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Add New Department</Typography>
                <input
                  style={inputStyle}
                  placeholder="Department name (e.g. ECE, MBA)"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
                />
                <button style={btnStyle} onClick={handleAddDepartment}>➕ Add Department</button>
              </div>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>All Departments ({departments.length})</Typography>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "600px", marginBottom: "40px" }}>
                {departments.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No departments yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {departments.map((d, i) => (
                      <div key={d.id || d.name} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: DEPT_PALETTE[i % DEPT_PALETTE.length], display: "inline-block" }} />
                          <span style={{ fontWeight: 600, fontSize: "15px" }}>{d.name}</span>
                        </div>
                        <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteDepartment(d.name)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Box>
          )}

          {/* ════ ADD ADMIN ════ */}
          {selectedItem === "AddAdmin" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Add Admin (Mentor)</Typography>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "480px", marginBottom: "32px" }}>
                <input style={inputStyle} placeholder="Admin Name"  value={adminForm.name}       onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
                <input style={inputStyle} placeholder="Email"       value={adminForm.email}      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                <input style={inputStyle} type="password" placeholder="Password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                <select style={{ ...inputStyle, background: "#fff", cursor: "pointer" }} value={adminForm.department} onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}>
                  {departments.length === 0 ? (
                    <option value="">— No departments yet —</option>
                  ) : (
                    departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)
                  )}
                </select>
                {departments.length === 0 && (
                  <p style={{ color: "#f59e0b", fontSize: "13px", marginBottom: "10px" }}>⚠️ Add departments first.</p>
                )}
                <button style={btnStyle} onClick={handleAddAdmin} disabled={departments.length === 0}>➕ Add Admin</button>
              </div>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>All Admins ({admins.length})</Typography>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", overflowX: "auto", marginBottom: "40px" }}>
                {admins.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No admins yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["#", "Name", "Email", "Department", "Created", "Action"].map((h) => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a, i) => (
                        <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{i + 1}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 500 }}>{a.name}</td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{a.email}</td>
                          <td style={{ padding: "12px 14px" }}><DeptBadge dept={a.department} departments={departments} /></td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteAdmin(a.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Box>
          )}

          {/* ════ ANNOUNCEMENTS ════ */}
          {selectedItem === "Announcements" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Announcements</Typography>

              {/* Post form */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "560px", marginBottom: "32px" }}>
                <input style={inputStyle} placeholder="Title" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} />
                <textarea
                  style={{ ...inputStyle, height: "100px", resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Message…"
                  value={annForm.message}
                  onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                />
                <select style={{ ...inputStyle, background: "#fff", cursor: "pointer" }} value={annForm.target} onChange={(e) => setAnnForm({ ...annForm, target: e.target.value })}>
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.name} value={d.name}>{d.name} Only</option>
                  ))}
                </select>
                <button style={btnStyle} onClick={handleAddAnnouncement}>📢 Post Announcement</button>
              </div>

              {/* ✅ NEW: Announcement list with replies + voice */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Posted Announcements ({announcements.length})
              </Typography>

              {announcements.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No announcements yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "40px" }}>
                  {announcements.map((a) => (
                    <div key={a.id} style={{
                      background: "#fff", borderRadius: "12px", padding: "20px 24px",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                      borderLeft: `5px solid ${getDeptColor(a.target, departments)}`,
                    }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <DeptBadge dept={a.target === "all" ? "All" : a.target} departments={departments} />
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                        <IconButton size="small" sx={{ color: "#ef4444" }} onClick={() => handleDeleteAnn(a.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>

                      <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>{a.title}</p>
                      <p style={{ color: "#475569", marginBottom: "12px", fontSize: "14px" }}>{a.message}</p>

                      {/* Replies */}
                      {(replies[a.id] || []).length > 0 && (
                        <div style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: "2px solid #e2e8f0" }}>
                          {(replies[a.id] || []).map((r, i) => (
                            <div key={i} style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px" }}>
                              <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                                {r.user_name || "User"}
                                {r.is_voice === 1 && <span style={{ color: "#7c3aed", marginLeft: "6px", fontSize: "10px" }}>🎤 voice</span>}
                              </span>
                              <p style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>{r.reply_text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          style={{ flex: 1, padding: "9px 14px", fontSize: "13px", border: "1px solid #e2e8f0", borderRadius: "8px", outline: "none", fontFamily: "inherit" }}
                          placeholder="Write a reply…"
                          value={replyText[a.id] || ""}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && submitReply(a.id, false)}
                        />
                        <button
                          onClick={() => startVoice(a.id)}
                          title="Voice reply"
                          style={{
                            padding: "9px 11px", border: "1px solid #e2e8f0", borderRadius: "8px",
                            cursor: "pointer", fontSize: "15px",
                            background: isListening === a.id ? "#fee2e2" : "#f8fafc",
                          }}
                        >🎤</button>
                        <button
                          onClick={() => submitReply(a.id, false)}
                          style={{ padding: "9px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                        >Reply</button>
                      </div>
                      {isListening === a.id && (
                        <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>🎤 Listening… speak now</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Box>
          )}

          {/* ════ ✅ NEW: MARKS REPORT ════ */}
          {selectedItem === "MarksReport" && !deptMarksDetail && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>Marks Report by Department</Typography>
              <Typography sx={{ color: "#64748b", mb: 3, fontSize: "14px" }}>
                Click any department to see all mark entries for that department.
              </Typography>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
                {marksByDept.length === 0 ? (
                  <p style={{ color: "#94a3b8" }}>No marks data yet.</p>
                ) : (
                  marksByDept.map((d) => (
                    <div
                      key={d.department}
                      onClick={() => fetchDeptMarksDetail(d.department)}
                      style={{
                        padding: "20px 32px", borderRadius: "12px",
                        background: "#fff", border: `2px solid ${getDeptColor(d.department, departments)}`,
                        textAlign: "center", cursor: "pointer", minWidth: "140px",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
                        transition: "transform 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                    >
                      <p style={{ fontWeight: 700, color: getDeptColor(d.department, departments), fontSize: "30px" }}>{d.count}</p>
                      <p style={{ color: "#475569", fontSize: "14px", marginTop: "4px" }}>{d.department}</p>
                      <p style={{ color: "#94a3b8", fontSize: "11px" }}>mark entries</p>
                    </div>
                  ))
                )}
              </div>
            </Box>
          )}

          {/* ════ MARKS DETAIL (drill-down) ════ */}
          {selectedItem === "MarksDetail" && deptMarksDetail && (
            <Box>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <button
                  onClick={() => { setSelectedItem("MarksReport"); setDeptMarksDetail(null); }}
                  style={{ padding: "8px 16px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                >
                  ← Back
                </button>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {deptMarksDetail.dept} — Mark Entries ({deptMarksDetail.rows.length})
                </Typography>
              </div>

              <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 14px rgba(0,0,0,0.07)", overflowX: "auto", marginBottom: "40px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#1e293b", color: "#fff" }}>
                      {["#", "Student", "Subject", "Semester", "Marks", "Grade", "Grade Pts", "Credits"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deptMarksDetail.rows.map((m, i) => (
                      <tr key={m.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{m.student_name}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{m.subject_name}</td>
                        <td style={{ padding: "12px 16px" }}>{m.semester}</td>
                        <td style={{ padding: "12px 16px" }}>{m.marks_scored}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: 700, padding: "2px 10px", borderRadius: "20px", fontSize: "13px", background: "#f1f5f9" }}>
                            {m.grade}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{m.grade_points}</td>
                        <td style={{ padding: "12px 16px" }}>{m.credits}</td>
                      </tr>
                    ))}
                    {deptMarksDetail.rows.length === 0 && (
                      <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No marks found for this department</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Box>
          )}

        </Main>
      </Box>
    </>
  );
}