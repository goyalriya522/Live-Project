import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { WifiOff, Clock, RefreshCw } from 'lucide-react';
import { formatTime, formatDate } from '../utils/formatters';

export const OfflineBanner = () => {
  const { isOnline, lastSyncTimestamp, refreshOfflineCache, syncStatus } = useOffline();

  if (isOnline && syncStatus !== 'syncing') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/20 rounded-full">
            <WifiOff className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-bold">You're offline.</span> Showing your last saved bus information.
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {lastSyncTimestamp && (
            <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 text-amber-200" />
              <span>Last updated: {formatDate(lastSyncTimestamp)} at {formatTime(lastSyncTimestamp)}</span>
            </div>
          )}

          <button
            onClick={() => refreshOfflineCache()}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-1 bg-white text-slate-800 font-semibold px-2.5 py-1 rounded shadow hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Checking...' : 'Check Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;

