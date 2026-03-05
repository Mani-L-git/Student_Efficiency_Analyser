import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // ✅ important for form submit

    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    if (!gmailPattern.test(email)) {
      alert("Email must be in format example@gmail.com");
      return;
    }

    if (!specialCharPattern.test(password)) {
      alert("Password must contain at least one special character");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      const { token, role, id } = res.data;

      if (!token) {
        alert("Login failed!");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", id);

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "superadmin") {
        navigate("/superadmin");
      } else {
        alert("Unknown role!");
      }

    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Server not connected!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <h1>SLEA Portal</h1>

      {/* FORM  */}
      <form onSubmit={handleLogin} autoComplete="on">

        <input
          type="email"
          name="email"                        
          autoComplete="username"           
          placeholder="Enter Gmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          name="password"                   
          autoComplete="current-password"   
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
    </div>
  );
}

export default Login;