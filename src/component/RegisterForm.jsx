import React, { useState } from "react";
import "./Register.css";
import coffee from "./coffee.jpeg";
import { Link, useNavigate } from "react-router-dom";

function PasswordInput({ placeholder, value, onChange }) {
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

function RegisterForm() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    // Gmail / Yahoo rule
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/;
    if (!emailPattern.test(email)) {
      setError("Only Gmail or Yahoo accounts allowed");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      // If backend throws error, try to read JSON first, else text
      if (!res.ok) {
        let msg = "Registration failed";
        try {
          const errJson = await res.json();
          msg = errJson?.message || JSON.stringify(errJson);
        } catch {
          msg = await res.text();
        }
        setError(msg);
        return;
      }

      const userData = await res.json();

      // 👇 frontend-only avatar logic
      const avatar = email.includes("gmail.com")
        ? "/avatars/gmail.png"
        : "/avatars/yahoo.png";

      // ✅ IMPORTANT: store token + id + username/email
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          token: userData.token,
          avatar,
        })
      );

      // registration success → go home
      navigate("/Mhome");
    } catch (err) {
      setError("Server not responding");
    }
  };

  return (
    <div className="body">
      <div className="register-wrapper">
        <div className="register-container">
          <h1 className="title">Create Your Account</h1>

          {/* USERNAME */}
          <input
            type="text"
            className="username"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* EMAIL */}
          <input
            type="text"
            className="email"
            placeholder="Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <PasswordInput
            placeholder="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button className="btn" onClick={handleRegister}>
            Continue
          </button>

          <Link to="/log" className="log">
            <p className="login-line">Already have an account? Log in</p>
          </Link>
        </div>

        <div className="photo-wrapper">
          <img className="photo" src={coffee} alt="coffee" />
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
