import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Phone, Mail, Shield, Wifi, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-campus-navy text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-400/50 flex items-center justify-center p-1 shadow-md shadow-amber-400/20">
                <img src="/icons/campusbus-logo.svg" alt="CampusBus" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-white">
                  CampusBus
                </span>
                <span className="block text-[11px] font-bold text-amber-400">
                  Smart College Bus Tracking & Transit Portal
                </span>
              </div>
            </div>
            <p className="text-slate-300 font-medium text-xs">
              Official Centralized Transportation Portal
            </p>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Serving students, drivers, and campus administration across college routes and surrounding transit corridors (Route 1 to Route 95).
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
              <Wifi className="w-4 h-4" />
              <span>Offline Ready with Service Worker & IndexedDB Caching</span>
            </div>
          </div>

          {/* User Portals */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              User Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/student" className="hover:text-amber-400 transition-colors">
                  Student Live Tracking
                </Link>
              </li>
              <li>
                <Link to="/driver" className="hover:text-amber-400 transition-colors">
                  Driver Trip Cockpit
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Admin Fleet Management
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  User Authentication
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Helpline */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              CampusBus Transit Helpline
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>+91 164-2786001 / 2786041</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+91 95011-15101 (Transport Desk)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>transport@campusbus.edu</span>
              </li>
              <li className="text-slate-400 text-[11px] pt-1">
                Central Transport Department, CampusBus Transit Center, Muktsar Road, Bathinda, Punjab 151001
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CampusBus. All rights reserved.</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            CampusBus Smart Transit System • Route 1 to Route 95 Fleet Network
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

