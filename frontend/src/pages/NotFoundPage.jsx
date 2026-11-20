import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl">
          <Bus className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-amber-400">404</h1>
          <h2 className="text-xl font-bold mt-2">Bus Stop Not Found</h2>
          <p className="text-sm text-slate-400 mt-1">
            The transit route or page you are looking for does not exist or has been relocated.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to CampusBus Terminal</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

