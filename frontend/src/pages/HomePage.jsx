import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  MapPin,
  WifiOff,
  Clock,
  Shield,
  FileText,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Users,
  Compass,
  Zap,
  Phone,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { isOnline } = useOffline();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0F2537] via-[#0A192F] to-[#030712] text-white overflow-hidden py-16 sm:py-24 border-b border-slate-800">
        {/* Subtle grid pattern & institutional glows */}
        <div className="absolute inset-0 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:28px_28px] opacity-10"></div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and Pitch */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* College Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800/90 text-amber-300 border border-amber-400/40 text-xs font-bold backdrop-blur-md shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>CampusBus • Smart College Bus Tracking</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                CampusBus <span className="text-amber-400">Tracking System</span>
                <span className="block text-xl sm:text-2xl lg:text-3xl font-extrabold text-blue-200 mt-3 font-sans">
                  Smart College Bus & Transit Management Portal
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Connecting students, faculty, bus drivers, and campus administration through one centralized smart platform.
                Engineered for college routes covering Bathinda, Muktsar, Malout, Mansa, Dabwali, and surrounding regions with live GPS tracking, dynamic ETAs, delay alerts, and{' '}
                <strong className="text-emerald-300 font-semibold">Offline Access</strong> during weak cellular coverage.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-3">
                {isAuthenticated ? (
                  <Link
                    to={user?.role === 'admin' ? '/admin' : user?.role === 'driver' ? '/driver' : '/student'}
                    className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-400/25 flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <span>Go to My Dashboard ({user?.role?.toUpperCase()})</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-400/25 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <span>Sign In to CampusBus</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      to="/student"
                      className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm sm:text-base border border-slate-700 backdrop-blur-sm flex items-center gap-2 transition-colors"
                    >
                      <Compass className="w-5 h-5 text-amber-400" />
                      <span>Student Live Map</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Offline & Security Highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-emerald-400" />
                  <span>Works Offline (PWA + IndexedDB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Dedicated Student • Driver • Admin Portals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <span>Route 1 to Route 95 Ready</span>
                </div>
              </div>
            </div>

            {/* Right Column: Institutional Overview Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-amber-400/40 p-1 flex items-center justify-center">
                      <img src="/icons/campusbus-logo.svg" alt="CampusBus" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white block">CampusBus Transport Desk</span>
                      <span className="text-[10px] text-amber-300 font-mono">Central Fleet Management Portal</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE SYSTEM
                  </span>
                </div>

                {/* College Transport Specs */}
                <div className="mt-5 space-y-4 text-xs">
                  <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/70 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-bold text-white text-sm">Centralized Fleet Management</span>
                      <span className="text-amber-400 font-mono font-bold">Punjab (PB-03)</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      College buses operated across Malwa Punjab covering major student transit hubs with real-time stops, timings, and arrival forecasts.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Campus Location</span>
                      <p className="font-bold text-white mt-0.5 text-xs">Deon, Bathinda (151001)</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Exam Special Transit</span>
                      <p className="font-bold text-emerald-400 mt-0.5 text-xs">Exam Mode Enabled</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Real-time GPS updates and instant delay broadcasts to all student devices.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Navigation Quick Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Card */}
          <Link
            to="/student"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mt-4">Student Portal</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Select your assigned college bus route, view stop sequence, check morning pickup timings, and follow live bus movement on the map.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
              <span>Track Your Bus</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Driver Card */}
          <Link
            to="/driver"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Bus className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mt-4">Driver Cockpit</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Simple, high-contrast cockpit with oversized controls. Start commute trips, broadcast approaching stops, report traffic delays, or trigger breakdown alerts.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:gap-2 transition-all">
              <span>Open Driver Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            to="/admin"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mt-4">Admin Command Center</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Dedicated `/admin` control dashboard. Configure college routes (Route 1 to 95), assign buses & drivers, manage timetables, toggle Exam Mode, and resolve incidents.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
              <span>Open CampusBus Admin Desk</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* About the System Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Institutional Transit Management
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Safe, Reliable, and Smart Transportation with CampusBus
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            CampusBus operates a comprehensive educational transportation network with real-time route monitoring.
            This centralized web platform brings total transparency to students, parents, drivers, and campus administration.
          </p>
        </div>

        {/* 4 Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">Route 1 to 95 Ready</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tailored to store and manage official college bus corridors across Bathinda and neighboring Punjab districts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">Offline Resilience</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              PWA with IndexedDB automatically caches routes, stops, and schedules when traveling through weak network rural stretches.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">One-Click Exam Mode</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              CampusBus admin can activate special examination timings and express shuttle services with a single toggle.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-slate-900">Emergency Dispatch</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drivers can instantly broadcast breakdowns, obstructions, or delays to the CampusBus central transport office.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Standard Operating Flow
            </span>
            <h2 className="text-3xl font-black text-slate-900">How CampusBus Operates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="absolute -top-3.5 left-6 bg-blue-600 text-white text-xs font-black px-3 py-0.5 rounded-full">
                Step 1
              </span>
              <h4 className="font-bold text-base text-slate-900 mt-2">Driver Departs on Route</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The driver opens the cockpit, confirms their assigned vehicle, and taps <strong>"Start Trip"</strong> to commence the morning or evening shift.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="absolute -top-3.5 left-6 bg-amber-500 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full">
                Step 2
              </span>
              <h4 className="font-bold text-base text-slate-900 mt-2">Students Track Bus</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Students select their assigned route number, inspect stop arrival timings, and check dynamic arrival forecasts directly on the map.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="absolute -top-3.5 left-6 bg-emerald-600 text-white text-xs font-black px-3 py-0.5 rounded-full">
                Step 3
              </span>
              <h4 className="font-bold text-base text-slate-900 mt-2">Central Fleet Supervision</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The CampusBus transport administration oversees active trips, handles schedule adjustments, and coordinates maintenance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Institutional Excellence
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Transforming Campus Commutes in Bathinda
            </h2>
            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>No Cold Winter Waiting:</strong> Students avoid long waits at roadside stops during fog and winter mornings by tracking their bus arrival time.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Rural Network Continuity:</strong> Offline cached timetables prevent blank screens when passing through connectivity shadows between towns.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Driver Punctuality:</strong> Single-touch status triggers keep the control room updated without distracting drivers on the road.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Direct Helpdesk Support:</strong> Built-in helpline contacts connect students directly to the CampusBus central transport office.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Login Credentials Card */}
          <div className="bg-gradient-to-br from-[#0F2537] via-[#0A192F] to-[#030712] p-8 rounded-3xl text-white shadow-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-400/40 p-1 flex items-center justify-center">
                <img src="/icons/campusbus-logo.svg" alt="CampusBus" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-black text-xl text-white">CampusBus Portal Access</h3>
            </div>
            <p className="text-xs text-slate-300">
              Sign in with institutional credentials to access role dashboards:
            </p>

            <div className="mt-6 space-y-3 font-mono text-xs">
              <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">Admin:</span> admin@campusbus.edu
                </div>
                <span className="text-slate-300">Admin@123</span>
              </div>

              <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">Driver:</span> driver1@campusbus.edu
                </div>
                <span className="text-slate-300">Driver@123</span>
              </div>

              <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-blue-400 font-bold">Student:</span> student1@campusbus.edu
                </div>
                <span className="text-slate-300">Student@123</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-center block transition-all shadow-md"
              >
                Sign In With Demo Credentials
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
