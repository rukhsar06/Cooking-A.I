import React, { useState } from 'react';
import "../styles/login.css";
import cherry from "../photos/cherry.jpeg";
import { Link } from 'react-router-dom';

function PasswordInput({ className, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        className={className}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="eye-button"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

function LoginForm() {
  return (
    <div className="body">
      <div className="login-wrapper">
        <div className="login-container">
          <h1 className="title">COOKING A.I ASSISTENT</h1>

          <input type="text" className="email" placeholder="Enter Your Email" />

          {/* Password Inputs with proper className passing */}
          <PasswordInput 
            placeholder="  Enter Your Password" 
            className="password"
          />
          <Link className = "mhome" to="/Mhome">
          <button className="btn">Log in</button>
           

                {/* here we will put the link so that once logged in it will redirect to home page */}
         </Link>
         <p className = 'reg-line'>Don't have an account ?
                    <Link className = 'reg' to="/reg">Register</Link>
        </p>    {/*path for the reg */}
        </div>

        <div className="photo-wrapper">
          <img className="photo" src={cherry} alt="cherry" />
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
