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

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
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

const DEPT_PALETTE = [
  "#2563eb","#d97706","#16a34a","#b03e17","#7c3aed",
  "#0891b2","#db2777","#65a30d","#ea580c","#0f766e",
];

function getDeptColor(name, departments) {
  const idx = departments.findIndex((d) => d.name === name);
  return DEPT_PALETTE[idx % DEPT_PALETTE.length] || "#64748b";
}

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

function DeptBadge({ dept, departments = [] }) {
  const color = getDeptColor(dept, departments);
  return (
    <span
      style={{
        background: color,
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

export default function SuperAdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState("Dashboard");

  const [stats, setStats] = React.useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalMarks: 0,
    deptStats: [],
  });

  const [admins, setAdmins] = React.useState([]);
  const [adminForm, setAdminForm] = React.useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });

  const [announcements, setAnnouncements] = React.useState([]);
  const [annForm, setAnnForm] = React.useState({ title: "", message: "", target: "all" });

  // Departments state
  const [departments, setDepartments] = React.useState([]);
  const [newDeptName, setNewDeptName] = React.useState("");

  const [msg, setMsg] = React.useState("");

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  React.useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchStats();
    fetchAdmins();
    fetchAnnouncements();
    fetchDepartments();
  }, []);

  // Set default department in adminForm once departments load
  React.useEffect(() => {
    if (departments.length > 0 && !adminForm.department) {
      setAdminForm((prev) => ({ ...prev, department: departments[0].name }));
    }
  }, [departments]);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/superadmin/stats", { headers: getAuthHeader() });
      if (res.status === 401) { localStorage.clear(); navigate("/"); return; }
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error("fetchStats error:", err); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("http://localhost:5000/superadmin/admins", { headers: getAuthHeader() });
      if (res.status === 401) { localStorage.clear(); navigate("/"); return; }
      if (!res.ok) { console.error("Admins fetch failed:", res.status); return; }
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchAdmins error:", err); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("http://localhost:5000/announcements", { headers: getAuthHeader() });
      if (res.status === 401) { localStorage.clear(); navigate("/"); return; }
      if (!res.ok) { console.error("Announcements fetch failed:", res.status); return; }
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchAnnouncements error:", err); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5000/superadmin/departments", { headers: getAuthHeader() });
      if (res.status === 401) { localStorage.clear(); navigate("/"); return; }
      if (!res.ok) { console.error("Departments fetch failed:", res.status); return; }
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) { console.error("fetchDepartments error:", err); }
  };

  const handleAddDepartment = async () => {
    const name = newDeptName.trim();
    if (!name) { setMsg("❌ Department name required"); return; }
    try {
      const res = await fetch("http://localhost:5000/superadmin/department", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg(`✅ ${data.message}`);
      setNewDeptName("");
      await fetchDepartments();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteDepartment = async (name) => {
    if (!window.confirm(`Remove department '${name}'? This will NOT delete existing users.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/superadmin/department/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) { setMsg("❌ Failed to delete department"); return; }
      setMsg(`✅ Department '${name}' removed`);
      await fetchDepartments();
    } catch (err) { console.error("deleteDept error:", err); }
  };

  const handleAddAdmin = async () => {
    const { name, email, password, department } = adminForm;
    if (!name || !email || !password || !department) { setMsg("❌ All fields required"); return; }
    try {
      const res = await fetch("http://localhost:5000/superadmin/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ name, email, password, department }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg(`✅ ${data.message}`);
      setAdminForm({ name: "", email: "", password: "", department: departments[0]?.name || "" });
      await fetchAdmins();
      await fetchStats();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("Remove this admin?")) return;
    try {
      const res = await fetch(`http://localhost:5000/superadmin/admin/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) { setMsg("❌ Failed to delete admin"); return; }
      await fetchAdmins();
      await fetchStats();
    } catch (err) { console.error("deleteAdmin error:", err); }
  };

  const handleAddAnnouncement = async () => {
    const { title, message, target } = annForm;
    if (!title || !message) { setMsg("❌ Title and message required"); return; }
    try {
      const res = await fetch("http://localhost:5000/superadmin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ title, message, target }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`❌ ${data.message}`); return; }
      setMsg("✅ Announcement posted!");
      setAnnForm({ title: "", message: "", target: "all" });
      await fetchAnnouncements();
    } catch { setMsg("❌ Server error"); }
  };

  const handleDeleteAnn = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/superadmin/announcement/${id}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) { setMsg("❌ Failed to delete announcement"); return; }
      await fetchAnnouncements();
    } catch (err) { console.error("deleteAnn error:", err); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const menuItems = [
    { label: "Dashboard",     icon: <DashboardIcon /> },
    { label: "Departments",   icon: <ApartmentIcon /> },
    { label: "AddAdmin",      icon: <PeopleIcon />, display: "Add Admin" },
    { label: "Announcements", icon: <AnnouncementIcon /> },
  ];

  const sidebarItemStyle = (item) => ({
    background:
      selectedItem === item
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

  return (
    <>
      <style>{`
        html, body { height: auto !important; overflow-y: auto !important; overflow-x: hidden; }
        #root { height: auto !important; min-height: 100vh; }
      `}</style>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <CssBaseline />

        <AppBar position="fixed" open={open} sx={{ background: "linear-gradient(90deg,#141E30,#243B55)" }}>
          <Toolbar>
            <IconButton color="inherit" onClick={() => setOpen(true)} edge="start" sx={{ mr: 2, ...(open && { display: "none" }) }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Super Admin Dashboard</Typography>
          </Toolbar>
        </AppBar>

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
            <Typography sx={{ flexGrow: 1, ml: 1, color: "#fff", fontWeight: 700 }}>SLEA</Typography>
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

            <ListItem disablePadding onClick={handleLogout}>
              <ListItemButton
                sx={{
                  margin: "8px 14px",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  "&:hover": { background: "linear-gradient(90deg,#ff416c,#ff4b2b)", color: "#fff", transform: "translateX(6px)" },
                }}
              >
                <ListItemIcon sx={{ color: "#fff" }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        <Main open={open}>
          <DrawerHeader />

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
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Welcome, Super Admin 👋</Typography>
              <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
                <StatCard label="Total Students"      value={stats.totalStudents} color="#2563eb" />
                <StatCard label="Total Admins"        value={stats.totalAdmins}   color="#d97706" />
                <StatCard label="Total Marks Entries" value={stats.totalMarks}    color="#16a34a" />
              </div>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Students by Department</Typography>
                {stats.deptStats?.length > 0 ? (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {stats.deptStats.map((d) => (
                      <div key={d.department} style={{
                        padding: "16px 28px", borderRadius: "10px", background: "#f8fafc",
                        border: `2px solid ${getDeptColor(d.department, departments)}`, textAlign: "center",
                      }}>
                        <p style={{ fontWeight: 700, color: getDeptColor(d.department, departments), fontSize: "26px" }}>{d.count}</p>
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

          {/* ════ DEPARTMENTS ════ */}
          {selectedItem === "Departments" && (
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Manage Departments</Typography>

              {/* Add department form */}
              <div style={{
                background: "#fff", borderRadius: "12px", padding: "28px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "460px", marginBottom: "32px",
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Add New Department</Typography>
                <input
                  style={inputStyle}
                  placeholder="Department name (e.g. ECE, MBA)"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
                />
                <button style={btnStyle} onClick={handleAddDepartment}>
                  ➕ Add Department
                </button>
              </div>

              {/* List departments */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                All Departments ({departments.length})
              </Typography>
              <div style={{
                background: "#fff", borderRadius: "12px", padding: "16px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "600px", marginBottom: "40px",
              }}>
                {departments.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No departments added yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {departments.map((d, i) => (
                      <div key={d.id || d.name} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderRadius: "10px", background: "#f8fafc",
                        border: `1px solid #e2e8f0`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{
                            width: "10px", height: "10px", borderRadius: "50%",
                            background: DEPT_PALETTE[i % DEPT_PALETTE.length],
                            display: "inline-block",
                          }} />
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

              <div style={{
                background: "#fff", borderRadius: "12px", padding: "28px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "480px", marginBottom: "32px",
              }}>
                <input
                  style={inputStyle}
                  placeholder="Admin Name"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                />
                <input
                  style={inputStyle}
                  placeholder="Email"
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
                  {departments.length === 0 ? (
                    <option value="">— No departments yet —</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))
                  )}
                </select>
                {departments.length === 0 && (
                  <p style={{ color: "#f59e0b", fontSize: "13px", marginBottom: "10px" }}>
                    ⚠️ Please add departments first from the Departments section.
                  </p>
                )}
                <button style={btnStyle} onClick={handleAddAdmin} disabled={departments.length === 0}>
                  ➕ Add Admin
                </button>
              </div>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>All Admins ({admins.length})</Typography>
              <div style={{
                background: "#fff", borderRadius: "12px", padding: "16px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)", overflowX: "auto", marginBottom: "40px",
              }}>
                {admins.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No admins added yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["#", "Name", "Email", "Department", "Created", "Action"].map((h) => (
                          <th key={h} style={{
                            padding: "12px 14px", textAlign: "left", color: "#475569",
                            fontWeight: 600, borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a, i) => (
                        <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{i + 1}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 500 }}>{a.name}</td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{a.email}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <DeptBadge dept={a.department} departments={departments} />
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>
                            {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                          </td>
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

              <div style={{
                background: "#fff", borderRadius: "12px", padding: "28px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)", maxWidth: "560px", marginBottom: "32px",
              }}>
                <input
                  style={inputStyle}
                  placeholder="Title"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                />
                <textarea
                  style={{ ...inputStyle, height: "100px", resize: "vertical", fontFamily: "inherit" }}
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
                  {departments.map((d) => (
                    <option key={d.name} value={d.name}>{d.name} Only</option>
                  ))}
                </select>
                <button style={btnStyle} onClick={handleAddAnnouncement}>📢 Post Announcement</button>
              </div>

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
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>{a.title}</p>
                        <p style={{ color: "#475569", marginBottom: "8px" }}>{a.message}</p>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <DeptBadge dept={a.target === "all" ? "All" : a.target} departments={departments} />
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                      </div>
                      <IconButton sx={{ color: "#ef4444", ml: 2 }} onClick={() => handleDeleteAnn(a.id)}>
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
    </>
  );
}