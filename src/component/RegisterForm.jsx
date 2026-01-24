import React, { useState } from 'react';
import './Register.css';
import coffee from './coffee.jpeg';
import { Link }  from 'react-router-dom';

function PasswordInput({ placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        className="password"
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


function RegisterForm() {
  return (
    <div className="body">
      <div className="register-wrapper">
        <div className="register-container">
          <h1 className="title">Create Your Account</h1>
          <input type="text" className="email" placeholder="Enter Your Email" />
          <PasswordInput placeholder="Enter Your Password" className ='password' />
          <PasswordInput placeholder="Confirm Your Password" className= 'confirm-password'/>

          {/*path for the main home*/}
          <Link className = "mhome" to="/Mhome">
          <button className = 'btn'>Continue</button>
          </Link>

          <p className = 'login-line'>Already Registered ?
            <Link className = 'log' to="/log">Login</Link>
            </p>    {/*path for the login is log */}
        </div>

        <div className="photo-wrapper">        
           <img className="photo" src={coffee} alt="coffee" />
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
