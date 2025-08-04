import React from 'react';
import './Header.css';
import logo from '../assets/react.svg';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <img src={logo} alt="Company Logo" className="logo" />
        <h1 className="company-name">LiftTrack</h1>
      </div>
    </header>
  );
};

export default Header;
