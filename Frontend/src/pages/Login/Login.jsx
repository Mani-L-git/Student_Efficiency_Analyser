import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/login", { email, password });
      const { token, role, id } = res.data;

      if (!token) { setError("Login failed!"); return; }

      localStorage.setItem("token",  token);
      localStorage.setItem("role",   role);
      localStorage.setItem("userId", id);

      const routes = {
        admin:      "/admin",
        student:    "/student-dashboard",
        superadmin: "/superadmin",
        faculty:    "/faculty",
      };

      if (routes[role]) navigate(routes[role]);
      else setError("Unknown role — contact your administrator.");
    } catch (err) {
      setError(err.response?.data?.message || "Server not connected!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-bg" aria-hidden="true"/>

      <div className="login-card">

        {/* Welcome */}
        <h2 className="login-welcome">Welcome Back</h2>

        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-ring">
            <span className="login-logo-emoji">🎓</span>
          </div>
        </div>

        {/* Brand */}
        <div className="login-brand">
          <span className="login-brand-title">SLEA PORTAL</span>
          <div className="login-brand-bar"/>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} autoComplete="on" className="login-form">

          <input
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            required
          />

          <div className="login-pwd-wrap">
            <input
              type={showPwd ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              required
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? (
                /* Eye-off (password visible → click to hide) */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.39 1 12a10.94 10.94 0 0 1 2.06-3.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8a10.95 10.95 0 0 1-1.4 2.62"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                /* Eye (password hidden → click to show) */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12C2.73 7.61 7 4 12 4s9.27 3.61 11 8c-1.73 4.39-6 8-11 8S2.73 16.39 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading
              ? <><span className="login-spinner" aria-hidden="true"/> Logging in…</>
              : "Login"}
          </button>

        </form>

        <p className="login-footer">Student Learning &amp; Efficiency Analytics</p>
      </div>
    </div>
  );
}

export default Login;