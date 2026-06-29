import React from 'react';
import './Header.css';

function Header({ user }) {
  const currentTime = new Date().toLocaleTimeString();

  return (
    <header className="header">
      <div className="header-left">
        <h1>NURUL HR EPOS System</h1>
      </div>
      <div className="header-right">
        <span className="header-time">{currentTime}</span>
        <span className="header-user">{user?.username}</span>
      </div>
    </header>
  );
}

export default Header;
