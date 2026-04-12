import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import '../styles/Header.css';

// Create responsive navbar:
// - Hamburger menu on mobile
// - Horizontal menu on desktop
// - Collapsible mobile drawer using useState
// - Sticky top positioning
// - Responsive padding and spacing

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
  const dropdownRef = useRef(null);

  const syncLoginStatus = () => {
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
  };

  // Keep auth state in sync across tabs, redirects, and auth actions
  useEffect(() => {
    syncLoginStatus();
    window.addEventListener('storage', syncLoginStatus);
    window.addEventListener('auth-state-changed', syncLoginStatus);
    window.addEventListener('login-success', syncLoginStatus);
    window.addEventListener('focus', syncLoginStatus);

    return () => {
      window.removeEventListener('storage', syncLoginStatus);
      window.removeEventListener('auth-state-changed', syncLoginStatus);
      window.removeEventListener('login-success', syncLoginStatus);
      window.removeEventListener('focus', syncLoginStatus);
    };
  }, []);

  useEffect(() => {
    syncLoginStatus();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.dispatchEvent(new Event('auth-state-changed'));
    setIsLoggedIn(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleAccountDropdown = () => {
    setAccountDropdownOpen(!accountDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo and Title */}
        <Link to="/" className="flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              SafeVoice
            </h1>
            <p className="text-xs md:text-sm text-purple-200">
              Anonymous Civic Issue Reporting
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-200 hover:text-purple-300 transition-colors duration-300">
            Feed
          </Link>
          <Link to="/report" className="text-gray-200 hover:text-purple-300 transition-colors duration-300">
            Report Issue
          </Link>
          <Link to="/resolved" className="text-gray-200 hover:text-purple-300 transition-colors duration-300">
            Resolved
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="text-gray-200 hover:text-purple-300 transition-colors duration-300">
                Dashboard
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleAccountDropdown}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300"
                >
                  <User size={18} />
                  Account
                  <ChevronDown size={16} className={`transition-transform duration-200 ${
                    accountDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-purple-500/50 rounded-lg shadow-lg overflow-hidden z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-gray-200 hover:bg-purple-600/20 hover:text-purple-300 transition-colors duration-200"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        Profile
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-gray-200 hover:bg-red-600/20 hover:text-red-300 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <X size={16} />
                        Logout
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="text-gray-200 hover:text-purple-300 transition-colors duration-300">
                Login
              </Link>
              <Link
                to="/auth/register"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-purple-300 hover:text-pink-300 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-purple-600">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              to="/"
              className="text-gray-200 hover:text-purple-300 transition-colors duration-300 py-2"
              onClick={closeMenu}
            >
              Feed
            </Link>
            <Link
              to="/report"
              className="text-gray-200 hover:text-purple-300 transition-colors duration-300 py-2"
              onClick={closeMenu}
            >
              Report Issue
            </Link>
            <Link
              to="/resolved"
              className="text-gray-200 hover:text-purple-300 transition-colors duration-300 py-2"
              onClick={closeMenu}
            >
              Resolved
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-200 hover:text-purple-300 transition-colors duration-300 py-2"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-200 hover:text-purple-300 transition-colors duration-300 py-2"
                  onClick={closeMenu}
                >
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    Profile
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-2">
                    <X size={18} />
                    Logout
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-gray-200 hover:text-purple-300 transition-colors duration-300 py-2"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 text-center"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
