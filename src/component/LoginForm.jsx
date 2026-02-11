import React, { useState } from "react";
import "../styles/login.css";
import cherry from "../photos/cherry.jpeg";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config";

function PasswordInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-wrapper">
      <input
        type={visible ? "text" : "password"}
        className="password"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="eye-button"
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
console.log("API_BASE AT RUNTIME =", API_BASE);

function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const data = await res.json();

      const user = {
        id: data.id,
        username: data.username,
        email: data.email,
        token: data.token,
        avatar: "/avatars/default.png",
      };

      localStorage.setItem("user", JSON.stringify(user));
      navigate("/Mhome");
    } catch (err) {
      console.error("Login error:", err);
      setError("Server not responding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="body">
      <div className="login-wrapper">
        <div className="login-container">
          <h1 className="title">COOKING A.I ASSISTANT</h1>

          <input
            type="email"
            className="email"
            placeholder="Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            placeholder="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <Link to="/reg" className="reg">
            <p className="login-line">Don't have an account? Register</p>
          </Link>
        </div>

        <div className="photo-wrapper">
          <img className="photo" src={cherry} alt="cherry" />
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
