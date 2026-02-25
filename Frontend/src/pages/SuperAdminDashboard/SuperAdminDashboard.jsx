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

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(4),
    marginLeft: open ? 0 : `-${drawerWidth}px`,
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
  })
);

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"]),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

// ─── Reusable input style ───────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: "15px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  outline: "none",
  marginBottom: "12px",
  boxSizing: "border-box",
};

const btnStyle = {
  padding: "11px 24px",
  background: "linear-gradient(90deg,#1e3c72,#2a5298)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "15px",
  cursor: "pointer",
  marginTop: "4px",
};

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        borderTop: `4px solid ${color}`,
      }}
    >
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "32px", fontWeight: "bold", color }}>{value}</p>
    </div>
  );
}

// ─── Department badge ────────────────────────────────────────────────
const deptColor = { IT: "#2563eb", Mechanical: "#d97706", Civil: "#16a34a" };

function DeptBadge({ dept }) {
  return (
    <span
      style={{
        background: deptColor[dept] || "#64748b",
        color: "#fff",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {dept}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [open, setOpen] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState("Dashboard");

  // Stats
  const [stats, setStats] = React.useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalMarks: 0,
    deptStats: [],
  });

  // Admins
  const [admins, setAdmins] = React.useState([]);
  const [adminForm, setAdminForm] = React.useState({
    name: "",
    email: "",
    password: "",
    department: "IT",
  });

  // Announcements
  const [announcements, setAnnouncements] = React.useState([]);
  const [annForm, setAnnForm] = React.useState({
    title: "",
    message: "",
    target: "all",
  });

  const [msg, setMsg] = React.useState("");

  // ── on mount ──
  React.useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchStats();
    fetchAdmins();
    fetchAnnouncements();
  }, []);

  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Fetch helpers ──────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/superadmin/stats", { headers: authHeader });
      const data = await res.json();
      setStats(data);
    } catch { /* silent */ }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("http://localhost:5000/superadmin/admins", { headers: authHeader });
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("http://localhost:5000/announcements", { headers: authHeader });
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  // ── Add Admin ──────────────────────────────────────────────────────
  const handleAddAdmin = async () => {
    const { name, email, password, department } = adminForm;
    if (!name || !email || !password || !department) {
      setMsg("❌ All fields required"); return;
    }
    try {
      const res = await fetch("http://localhost:5000/superadmin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name, email, password, department }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg(`✅ ${data.message}`);
      setAdminForm({ name: "", email: "", password: "", department: "IT" });
      fetchAdmins();
      fetchStats();
    } catch { setMsg("❌ Server error"); }
  };

  // ── Delete Admin ───────────────────────────────────────────────────
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Remove this admin?")) return;
    try {
      await fetch(`http://localhost:5000/superadmin/admin/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      fetchAdmins();
      fetchStats();
    } catch { /* silent */ }
  };

  // ── Add Announcement ───────────────────────────────────────────────
  const handleAddAnnouncement = async () => {
    const { title, message, target } = annForm;
    if (!title || !message) { setMsg("❌ Title and message required"); return; }
    try {
      const res = await fetch("http://localhost:5000/superadmin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ title, message, target }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg("✅ Announcement posted!");
      setAnnForm({ title: "", message: "", target: "all" });
      fetchAnnouncements();
    } catch { setMsg("❌ Server error"); }
  };

  // ── Delete Announcement ────────────────────────────────────────────
  const handleDeleteAnn = async (id) => {
    try {
      await fetch(`http://localhost:5000/superadmin/announcement/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      fetchAnnouncements();
    } catch { /* silent */ }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // ── Sidebar menu items ─────────────────────────────────────────────
  const menuItems = [
    { label: "Dashboard",      icon: <DashboardIcon /> },
    { label: "AddAdmin",       icon: <PeopleIcon />,       display: "Add Admin" },
    { label: "Announcements",  icon: <AnnouncementIcon /> },
  ];

  const sidebarItemStyle = (item) => ({
    background: selectedItem === item
      ? "linear-gradient(90deg,#ffffff,#f1f5ff)"
      : "transparent",
    color: selectedItem === item ? "#1e3c72" : "#ffffff",
    margin: "8px 14px",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    "&:hover": {
      background: "linear-gradient(90deg,#4facfe,#00f2fe)",
      color: "#ffffff",
      transform: "translateX(6px)",
    },
  });

  // ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Top Bar */}
      <AppBar
        position="fixed"
        open={open}
        sx={{ background: "linear-gradient(90deg,#141E30,#243B55)" }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setOpen(true)}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Super Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "linear-gradient(180deg,#1e3c72,#2a5298)",
            color: "#fff",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography sx={{ flexGrow: 1, ml: 1, color: "#fff", fontWeight: 700 }}>
            SLEA
          </Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: "#fff" }}>
            {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

        <List>
          {menuItems.map(({ label, icon, display }) => (
            <ListItem disablePadding key={label}>
              <ListItemButton
                onClick={() => { setSelectedItem(label); setMsg(""); }}
                sx={sidebarItemStyle(label)}
              >
                <ListItemIcon sx={{ color: selectedItem === label ? "#1e3c72" : "#fff" }}>
                  {icon}
                </ListItemIcon>
                <ListItemText primary={display || label} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Logout */}
          <ListItem disablePadding onClick={handleLogout}>
            <ListItemButton
              sx={{
                margin: "8px 14px",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(90deg,#ff416c,#ff4b2b)",
                  color: "#fff",
                  transform: "translateX(6px)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "#fff" }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* ── Main Content ── */}
      <Main open={open}>
        <DrawerHeader />

        {/* Status message */}
        {msg && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: "16px",
              borderRadius: "8px",
              background: msg.startsWith("✅") ? "#dcfce7" : "#fee2e2",
              color: msg.startsWith("✅") ? "#16a34a" : "#dc2626",
              fontWeight: 500,
            }}
          >
            {msg}
          </div>
        )}

        {/* ════ DASHBOARD ════════════════════════════════════════════ */}
        {selectedItem === "Dashboard" && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
              Welcome, Super Admin 👋
            </Typography>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
              <StatCard label="Total Students" value={stats.totalStudents} color="#2563eb" />
              <StatCard label="Total Admins"   value={stats.totalAdmins}   color="#d97706" />
              <StatCard label="Total Marks Entries" value={stats.totalMarks} color="#16a34a" />
            </div>

            {/* Dept breakdown */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Students by Department
              </Typography>
              {stats.deptStats?.length > 0 ? (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {stats.deptStats.map((d) => (
                    <div
                      key={d.department}
                      style={{
                        padding: "16px 28px",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: `2px solid ${deptColor[d.department] || "#94a3b8"}`,
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontWeight: 700, color: deptColor[d.department], fontSize: "26px" }}>
                        {d.count}
                      </p>
                      <p style={{ color: "#475569", fontSize: "13px" }}>{d.department}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>No department data yet.</p>
              )}
            </div>
          </Box>
        )}

        {/* ════ ADD ADMIN ════════════════════════════════════════════ */}
        {selectedItem === "AddAdmin" && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
              Add Admin (Mentor)
            </Typography>

            {/* Form */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "28px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                maxWidth: "480px",
                marginBottom: "32px",
              }}
            >
              <input
                style={inputStyle}
                placeholder="Admin Name"
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              />
              <input
                style={inputStyle}
                placeholder="Email (e.g. it@gmail.com)"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              />
              <select
                style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}
                value={adminForm.department}
                onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
              >
                <option value="IT">IT</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
              <button style={btnStyle} onClick={handleAddAdmin}>
                ➕ Add Admin
              </button>
            </div>

            {/* Existing admins table */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              All Admins ({admins.length})
            </Typography>
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                overflowX: "auto",
              }}
            >
              {admins.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                  No admins added yet.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["#", "Name", "Email", "Department", "Created", "Action"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 14px",
                            textAlign: "left",
                            color: "#475569",
                            fontWeight: 600,
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{i + 1}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 500 }}>{a.name}</td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>{a.email}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <DeptBadge dept={a.department} />
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <IconButton
                            size="small"
                            sx={{ color: "#ef4444" }}
                            onClick={() => handleDeleteAdmin(a.id)}
                          >
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

        {/* ════ ANNOUNCEMENTS ════════════════════════════════════════ */}
        {selectedItem === "Announcements" && (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
              Announcements
            </Typography>

            {/* Post form */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "28px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                maxWidth: "560px",
                marginBottom: "32px",
              }}
            >
              <input
                style={inputStyle}
                placeholder="Title"
                value={annForm.title}
                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              />
              <textarea
                style={{
                  ...inputStyle,
                  height: "100px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                placeholder="Message..."
                value={annForm.message}
                onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
              />
              <select
                style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}
                value={annForm.target}
                onChange={(e) => setAnnForm({ ...annForm, target: e.target.value })}
              >
                <option value="all">All Departments</option>
                <option value="IT">IT Only</option>
                <option value="Mechanical">Mechanical Only</option>
                <option value="Civil">Civil Only</option>
              </select>
              <button style={btnStyle} onClick={handleAddAnnouncement}>
                📢 Post Announcement
              </button>
            </div>

            {/* List */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Posted Announcements ({announcements.length})
            </Typography>
            {announcements.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No announcements yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      padding: "20px 24px",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                      borderLeft: `5px solid ${deptColor[a.target] || "#2563eb"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                        {a.title}
                      </p>
                      <p style={{ color: "#475569", marginBottom: "8px" }}>{a.message}</p>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <DeptBadge dept={a.target === "all" ? "All" : a.target} />
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                    </div>
                    <IconButton
                      sx={{ color: "#ef4444", ml: 2 }}
                      onClick={() => handleDeleteAnn(a.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </Box>
        )}
      </Main>
    </Box>
  );
} 