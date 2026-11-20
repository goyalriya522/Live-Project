import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bus,
  Lock,
  Mail,
  Shield,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('student'); // 'student' | 'driver' | 'admin'
  const [email, setEmail] = useState('student1@campusbus.edu');
  const [password, setPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1-Click Demo Fill
  const setDemoRole = (targetRole) => {
    setRole(targetRole);
    setError('');
    if (targetRole === 'admin') {
      setEmail('admin@campusbus.edu');
      setPassword('Admin@123');
    } else if (targetRole === 'driver') {
      setEmail('driver1@campusbus.edu');
      setPassword('Driver@123');
    } else {
      setEmail('student1@campusbus.edu');
      setPassword('Student@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password, role });
      const userRole = res.user?.role || role;

      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'driver') {
        navigate('/driver');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-campus-navy to-slate-950 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-[#0F2537] p-6 text-white text-center relative border-b border-slate-800">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-amber-400/50 flex items-center justify-center p-1.5 shadow-md shadow-amber-400/20 group-hover:scale-105 transition-transform">
              <img src="/icons/campusbus-logo.svg" alt="CampusBus" className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <span className="font-extrabold text-lg text-white block leading-tight">
                CampusBus
              </span>
              <span className="text-[11px] font-bold text-amber-400">
                Smart College Bus Tracking & Transit Portal
              </span>
            </div>
          </Link>
          <h2 className="text-base font-bold text-slate-100">Sign In to CampusBus Portal</h2>
          <p className="text-xs text-slate-300 mt-0.5">Route 1 to Route 95 College Bus Tracking</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Demo Autofill
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoRole('student')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                role === 'student'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('driver')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                role === 'driver'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('admin')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                role === 'admin'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campusbus.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-campus-navy hover:bg-slate-900 text-white font-bold text-sm shadow-lg shadow-campus-navy/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New student or driver?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

