import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Search, PlusCircle, Bell, User, LogOut, Heart, Moon, Sun, Menu, X, FileText, Shield
} from 'lucide-react';
import api from '../utils/api';

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState(null);
  const [isBellOpen, setBellOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const bellRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user')) || { id: null, name: 'Guest', email: 'N/A', role: '' };
  const isAuthenticated = !!user.id;

  // Build initials for profile icon
  const initials = (user?.name || "G").split(' ').map(word=>word[0]).join('').toUpperCase().slice(0,2);

  const menuItems = [
    { text: 'Dashboard', path: '/', icon: Home, show: true },
    { text: 'Report Item', path: '/report', icon: PlusCircle, show: isAuthenticated },
    { text: 'Claim Item', path: '/claim', icon: FileText, show: true },
    { text: 'Saved Items', path: '/saved', icon: Heart, show: isAuthenticated },
    { text: 'Profile', path: '/profile', icon: User, show: isAuthenticated },
    { text: 'Admin Dashboard', path: '/admin', icon: Shield, show: isAuthenticated && user?.role === 'admin' },
    { text: 'Login', path: '/login', icon: User, show: !isAuthenticated },
    { text: 'Register', path: '/register', icon: User, show: !isAuthenticated },
  ];

  // Fetch notifications
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications(null);
      return;
    }
    setNotifications(null);
    let cancelled = false;
    api.get(`/users/${user.id}/activity`).then(({ data }) => {
      if (!cancelled) setNotifications(data.slice(0, 5));
    }).catch(() => {
      if (!cancelled) setNotifications([]);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, user.id]);

  // Set/document dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle outside click closes
  useEffect(() => {
    const handleClickOutside = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sticky shrink effect
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('py-2', 'backdrop-blur-md');
      } else {
        nav.classList.remove('py-2', 'backdrop-blur-md');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers
  const toggleMobileMenu = () => {
    setMobileMenuOpen(v => !v);
    setSearchOpen(false);
    setProfileOpen(false);
    setBellOpen(false);
  };
  const toggleSearch = () => {
    setSearchOpen(v => !v);
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setBellOpen(false);
  };
  const toggleProfile = () => {
    setProfileOpen(v => !v);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setBellOpen(false);
  };
  const toggleBell = () => {
    setBellOpen(v => !v);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setProfileOpen(false);
  };
  const toggleDarkMode = () => setDarkMode(v => !v);
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };
  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.search.value.trim();
    if (query) {
      navigate(`/?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      e.target.reset();
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg transition-all duration-300 select-none">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-white text-xl font-bold tracking-tight hover:text-blue-200 transition-colors duration-200"
          aria-label="Lost & Found Home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span>Lost & Found</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {menuItems.filter(item=>item.show && !['Profile','Login','Register'].includes(item.text)).map(item=>(
              <Link
                key={item.text}
                to={item.path}
                className={`flex items-center space-x-1 text-white text-sm font-medium px-3 py-2 rounded-full transition-all duration-200
                  ${location.pathname === item.path ? 'bg-blue-800 shadow-md' : 'hover:bg-blue-700 hover:shadow-sm'}`}
                aria-label={item.text}
              >
                <item.icon size={18} />
                <span>{item.text}</span>
              </Link>
            ))}
          </div>

          {/* Search */}
          <button onClick={toggleSearch} className="p-2 text-white hover:bg-blue-700 rounded-full" aria-label="Toggle search">
            <Search size={20} />
          </button>

          {/* Notification Bell */}
          {isAuthenticated && (
            <div className="relative" ref={bellRef}>
              <button
                onClick={toggleBell}
                className="p-2 text-white hover:bg-blue-700 rounded-full relative"
                aria-label={`Notifications (${notifications ? notifications.length : 0} unread)`}
              >
                <Bell size={20} />
                {notifications && notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              {/* Notification dropdown */}
              {isBellOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 text-left z-50">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Recent Activity</span>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {notifications === null ? (
                      <div className="flex flex-col gap-2">
                        {[...Array(3)].map((_,i)=>(
                          <div key={i} className="h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-2 w-4/5"/>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm py-2">No new activity</p>
                    ) : notifications.map((activity,i)=>(
                      <div key={i} className="text-gray-700 dark:text-gray-200 py-1 text-sm truncate border-b border-dashed last:border-0">
                        {activity.message}
                        <div className="text-xs text-gray-400">{activity.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={toggleProfile}
              className="flex items-center space-x-2 text-white hover:bg-blue-700 rounded-full px-3 py-2"
              aria-label={isAuthenticated ? `Profile: ${user.name}` : 'Authentication options'}
              tabIndex={0}
            >
              <div className="bg-blue-200 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold uppercase">{initials}</div>
              <span className="text-sm font-medium hidden lg:inline">{user.name}</span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50">
                <div className="p-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-200 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold uppercase">{initials}</div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium leading-tight">{user.name}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{user.email}</p>
                          {user.role && <p className="text-xs rounded px-2 bg-blue-100 text-blue-700 mt-1 inline-block">{user.role}</p>}
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                        onClick={()=>setProfileOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                        onClick={()=>setProfileOpen(false)}
                      >
                       Reported Items
                      </Link>
                      <Link
                        to="/saved"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                        onClick={()=>setProfileOpen(false)}
                      >
                        Saved Items
                      </Link>
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs font-medium">Recent Activity</p>
                        {notifications && notifications.length === 0 && (
                          <p className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">No new activity</p>
                        )}
                        {notifications && notifications.map((activity,i)=>
                          <p key={i} className="px-4 py-2 text-gray-700 dark:text-gray-200 text-xs truncate">{activity.message}</p>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm mt-2"
                        tabIndex={0}
                      >
                        <span className="font-semibold">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                        onClick={()=>setProfileOpen(false)}
                      >Login</Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                        onClick={()=>setProfileOpen(false)}
                      >Register</Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            tabIndex={0}
          >
            <span className="transition-transform duration-200">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</span>
          </button>
        </div>
        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Search Bar (Desktop/Mobile) */}
      {isSearchOpen && (
        <div
          className="bg-white dark:bg-gray-800 shadow-lg mx-auto my-2 rounded-xl md:rounded-full absolute left-0 right-0 md:top-16 md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-2xl md:w-full z-50"
          style={{maxWidth:"550px"}}
          ref={searchRef}
        >
          <form onSubmit={handleSearch} className="flex items-center p-2">
            <Search className="ml-2 text-gray-500 dark:text-gray-400" size={20} />
            <input
              type="text"
              name="search"
              placeholder="Search items by keyword/location..."
              className="w-full px-3 py-2 text-gray-900 dark:text-white bg-transparent focus:outline-none"
              aria-label="Search items"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Submit search"
            >
              Go
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-blue-700 dark:bg-gray-800 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div className="container mx-auto px-4 space-y-2">
          {menuItems.filter(item=>item.show).map(item=>(
            <Link
              key={item.text}
              to={item.path}
              className={`flex items-center space-x-2 text-white dark:text-gray-200 text-sm font-medium px-4 py-3 rounded-lg transition-colors
                ${location.pathname === item.path ? 'bg-blue-800 dark:bg-gray-700' : 'hover:bg-blue-600 dark:hover:bg-gray-700'}`}
              onClick={toggleMobileMenu}
              aria-label={item.text}
              tabIndex={0}
            >
              <item.icon size={18} />
              <span>{item.text}</span>
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full text-left text-red-400 dark:text-red-300 text-sm font-medium px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Logout"
              tabIndex={0}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="flex items-center space-x-2 w-full text-left text-white dark:text-gray-200 text-sm font-medium px-4 py-3 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-lg"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            tabIndex={0}
          >
            {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;