import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      const { token, role, id } = res.data;

      if (token) {
        // Store token properly with Bearer format
        localStorage.setItem("token", `Bearer ${token}`);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", id);

        // Redirect based on role
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "student") {
          navigate("/student-dashboard");
        } else if (role === "superadmin") {
          navigate("/superadmin");
        } else {
          alert("Unknown role!");
        }
      } else {
        alert("Login failed!");
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Server not connected!");
      }
    }
  };

  return (
    <div className="login">
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
