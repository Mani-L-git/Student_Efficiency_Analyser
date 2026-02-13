import React from "react";
import { useNavigate } from "react-router-dom";

function SuperAdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <h1>Super Admin Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default SuperAdminDashboard;
