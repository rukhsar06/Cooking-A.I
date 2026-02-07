import React, { useState } from 'react';
import './Navbar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Wonwoo from "../photos/Wonwoo.jpeg";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const user = JSON.parse(localStorage.getItem("user"));

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    closeMenu(); 
    navigate("/");
  };

  // ROUTE-BASED NAVBAR COLOR
  let extraClass = "";
  if (path === "/reg") extraClass = "navbar-reg";
  else if (path === "/log") extraClass = "nav-log";
  else if (path === "/Mhome") extraClass = "nav-mhome"; 
  else if (path === "/profile") extraClass = "nav-profile";
  else if (path === "/history") extraClass = "nav-history";
  else if (path === "/liked") extraClass = "nav-liked";
else if (path.startsWith("/recipe/")) extraClass = "nav-recipe-detail";


  return (
    <div className={`navbar ${extraClass}`}>
      <header className="navbar-header">

        <div className="left-side">
          {!user ? (
            <Link className="login-link" to="/reg">
              Let's Get Started
            </Link>
          ) : (
            <div className="profile-wrapper">
             <img
               src={user?.avatar || Wonwoo}
               className="nav-avatar"
               alt="profile"
               onClick={toggleMenu}
               onError={(e) => { e.target.src = Wonwoo; }}
              />


              {/* DROPDOWN */}
              {menuOpen && (
                <div className="profile-menu">

                   {/* USER HEADER */}
                  <div className="profile-menu-header">
                  <img
                   src={user?.avatar || Wonwoo}
                   alt="profile"
                   className="menu-avatar"
                   />
                <p className="menu-username">{user?.username}</p>
                  </div>

                  <div className="menu-divider"></div>

                  <Link to="/Mhome" className="menu-item" onClick={closeMenu}>
                    Let's Cook
                  </Link>

                  <Link to="/profile" className="menu-item" onClick={closeMenu}>
                    Profile
                  </Link>

                  <Link to="/history" className="menu-item" onClick={closeMenu}>
                    History
                  </Link>

                  <button 
                    className="menu-item logout" 
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="right-side">
          <Link className="nav-link" to="/">Home</Link>
          <a className="nav-link" href="#dev">About Me</a>
          <a className="nav-link" href="#why">Why I Started</a>
          <a className="nav-link" href="#highlights">Highlights</a>
          <Link className="nav-link" to="/Mhome">Let's Cook</Link>
        </div>

      </header>
    </div>
  );
}

export default Navbar;
