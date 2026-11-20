import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import OfflineIndicator from './OfflineIndicator';
import {
  Bus,
  Shield,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Compass,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const Navbar = ({ onOpenNotifications, unreadCount = 0 }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cachedData } = useOffline();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isExamModeActive = cachedData?.systemSettings?.examModeEnabled;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-campus-navy text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Website Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-amber-400/50 flex items-center justify-center p-1 shadow-md shadow-amber-400/20 group-hover:scale-105 transition-transform">
              <img src="/icons/campusbus-logo.svg" alt="CampusBus Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  CampusBus
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 border border-amber-300">
                  TRANSIT
                </span>
              </div>
              <p className="text-[10px] text-amber-300 font-semibold tracking-wide hidden sm:block">
                Smart College Bus Tracking & Transit Portal
              </p>
            </div>
          </Link>

          {/* Exam Mode Global Alert Pill */}
          {isExamModeActive && (
            <div className="hidden md:flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Exam Mode Active: Special Routes Enabled</span>
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            {isAuthenticated && user?.role === 'student' && (
              <Link
                to="/student"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/student') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Track My Bus
              </Link>
            )}

            {isAuthenticated && user?.role === 'driver' && (
              <Link
                to="/driver"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/driver') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Driver Cockpit
              </Link>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/admin') ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-3">
            {/* Offline Status Badge */}
            <OfflineIndicator />

            {/* Notification Bell Button */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Transportation Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Buttons / Profile */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">{user?.name}</span>
                  <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-5 space-y-2">
          {isExamModeActive && (
            <div className="p-2 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Exam Mode Active: Special routes running</span>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Home
          </Link>

          {isAuthenticated && (
            <>
              {user?.role === 'student' && (
                <Link
                  to="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-slate-800"
                >
                  Student Dashboard
                </Link>
              )}

              {user?.role === 'driver' && (
                <Link
                  to="/driver"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-slate-800"
                >
                  Driver Cockpit
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{user?.name}</p>
                  <p className="text-[10px] text-amber-400 uppercase">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 bg-rose-600/20 text-rose-300 rounded hover:bg-rose-600/30 font-medium"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

