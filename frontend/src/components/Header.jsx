import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
  const isLoggedIn = localStorage.getItem('accessToken');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">
            <h1>SafeVoice</h1>
            <p>Anonymous Civic Issue Reporting</p>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/" className="nav-link">Feed</Link>
          <Link to="/report" className="nav-link">Report Issue</Link>

          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="nav-link">Login</Link>
              <Link to="/auth/register" className="nav-link register-btn">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
