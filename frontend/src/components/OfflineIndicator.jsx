import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator = ({ showText = true }) => {
  const { syncStatus, isOnline } = useOffline();

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
        {showText && <span>Syncing...</span>}
      </div>
    );
  }

  if (!isOnline || syncStatus === 'offline') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        <WifiOff className="w-3.5 h-3.5 text-rose-600" />
        {showText && <span>Offline Mode</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
      {showText && <span>Online</span>}
    </div>
  );
};

export default OfflineIndicator;

