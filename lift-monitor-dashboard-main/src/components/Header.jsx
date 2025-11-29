import React from "react";
import { useAuth } from "../context/AuthContext";
import "./Header.css";
import logo from "../assets/logo.png";

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="header">
      <div className="header-content">
        <img src={logo} alt="Company Logo" className="logo" />
        <h1 className="company-name">ATLANWA ELEVATOR DASHBOARD</h1>
        {user && (
          <div className="header-user">
            <span className="user-name">Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
