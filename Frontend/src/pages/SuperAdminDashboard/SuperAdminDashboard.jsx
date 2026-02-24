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
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import AnnouncementIcon from '@mui/icons-material/Announcement';
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

function SuperAdminDashboard() {
  const theme = useTheme();
  const [selectedItem, setSelectedItem] = React.useState("Dashboard");

  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
    
      {/* Top Bar */}
      <AppBar
  position="fixed"
  open={open}
  sx={{
    background: "linear-gradient(90deg, #141E30, #243B55)",
  }}
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

      {/* Drawer */}
      <Drawer
  sx={{
    
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: drawerWidth,
      boxSizing: "border-box",
      background: "linear-gradient(180deg, #1e3c72, #2a5298)",
      color: "#fff",
    },
  }}
  variant="persistent"
  anchor="left"
  open={open}
>


  
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>

        <Divider />

        <List>

  {/* Dashboard */}
  <ListItem disablePadding>
    <ListItemButton
      onClick={() => setSelectedItem("Dashboard")}
      sx={{
        background:
          selectedItem === "Dashboard"
            ? "linear-gradient(90deg, #ffffff, #f1f5ff)"
            : "transparent",
        color:
          selectedItem === "Dashboard" ? "#1e3c72" : "#ffffff",
        margin: "8px 14px",
        borderRadius: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          background: "linear-gradient(90deg, #4facfe, #00f2fe)",
          color: "#ffffff",
          transform: "translateX(6px)",
        },
      }}
    >
      <ListItemIcon
        sx={{
          color:
            selectedItem === "Dashboard"
              ? "#1e3c72"
              : "#ffffff",
        }}
      >
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItemButton>
  </ListItem>


  {/* Add Admin */}
  <ListItem disablePadding>
    <ListItemButton
      onClick={() => setSelectedItem("AddAdmin")}
      sx={{
        background:
          selectedItem === "AddAdmin"
            ? "linear-gradient(90deg, #ffffff, #f1f5ff)"
            : "transparent",
        color:
          selectedItem === "AddAdmin" ? "#1e3c72" : "#ffffff",
        margin: "8px 14px",
        borderRadius: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          background: "linear-gradient(90deg, #43e97b, #38f9d7)",
          color: "#ffffff",
          transform: "translateX(6px)",
        },
      }}
    >
      <ListItemIcon
        sx={{
          color:
            selectedItem === "AddAdmin"
              ? "#1e3c72"
              : "#ffffff",
        }}
      >
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="Add Admin" />
    </ListItemButton>
  </ListItem>


  {/* Announcements */}
  <ListItem disablePadding>
    <ListItemButton
      onClick={() => setSelectedItem("Announcements")}
      sx={{
        background:
          selectedItem === "Announcements"
            ? "linear-gradient(90deg, #ffffff, #f1f5ff)"
            : "transparent",
        color:
          selectedItem === "Announcements"
            ? "#1e3c72"
            : "#ffffff",
        margin: "8px 14px",
        borderRadius: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          background: "linear-gradient(90deg, #ff512f, #dd2476)",
          color: "#ffffff",
          transform: "translateX(6px)",
        },
      }}
    >
      <ListItemIcon
        sx={{
          color:
            selectedItem === "Announcements"
              ? "#1e3c72"
              : "#ffffff",
        }}
      >
        <AnnouncementIcon />
      </ListItemIcon>
      <ListItemText primary="Announcements" />
    </ListItemButton>
  </ListItem>


  {/* Logout */}
  <ListItem disablePadding onClick={handleLogout}>
    <ListItemButton
      sx={{
        margin: "8px 14px",
        borderRadius: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          background: "linear-gradient(90deg, #ff416c, #ff4b2b)",
          color: "#ffffff",
          transform: "translateX(6px)",
        },
      }}
    >
      <ListItemIcon sx={{ color: "#ffffff" }}>
        <SettingsIcon />
      </ListItemIcon>
      <ListItemText primary="Logout" />
    </ListItemButton>
  </ListItem>

</List> 


      </Drawer>

      {/* Main Content */}
      <Main open={open}>
        <DrawerHeader />
       <Box
  sx={{
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  }}
>
  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
    Welcome Super Admin 
  </Typography>
</Box>
      </Main>
    </Box>
  );
}

export default SuperAdminDashboard;