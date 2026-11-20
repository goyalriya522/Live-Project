import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  saveOfflineSnapshot,
  getCachedOfflineData,
  queueOfflineAction,
  getQueuedOfflineActions,
  clearSyncedOfflineActions,
} from '../services/offlineStorage';
import api from '../services/api';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'online' : 'offline'); // 'online' | 'syncing' | 'offline'
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [cachedData, setCachedData] = useState(null);

  // Fetch fresh snapshot from server and persist to IndexedDB
  const refreshOfflineCache = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      setSyncStatus('syncing');
      const res = await api.get('/offline/snapshot');
      if (res.data) {
        await saveOfflineSnapshot(res.data);
        setLastSyncTimestamp(res.data.timestamp);
      }
      setSyncStatus('online');
    } catch (err) {
      console.warn('[OfflineContext] Failed to refresh snapshot from server:', err.message);
      setSyncStatus('online');
    }
  }, []);

  // Synchronize queued offline updates when coming back online
  const processQueuedActions = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const queued = await getQueuedOfflineActions();
      if (!queued || queued.length === 0) return;

      setSyncStatus('syncing');
      console.log(`[OfflineContext] Synchronizing ${queued.length} queued offline updates...`);

      const res = await api.post('/offline/sync', { queuedUpdates: queued });
      if (res.success && res.data?.processedResults) {
        const syncedIds = res.data.processedResults.map((r) => r.requestId);
        await clearSyncedOfflineActions(syncedIds);
        console.log(`[OfflineContext] Successfully synchronized offline updates.`);
      }

      await refreshOfflineCache();
      setSyncStatus('online');
    } catch (err) {
      console.warn('[OfflineContext] Sync error:', err.message);
      setSyncStatus('online');
    }
  }, [refreshOfflineCache]);

  // Load cached offline data from IndexedDB
  const loadCachedData = useCallback(async () => {
    const data = await getCachedOfflineData();
    setCachedData(data);
    if (data.lastSyncTimestamp) {
      setLastSyncTimestamp(data.lastSyncTimestamp);
    }
    return data;
  }, []);

  useEffect(() => {
    // Initial load from IndexedDB
    loadCachedData().then(() => {
      if (navigator.onLine) {
        refreshOfflineCache();
      }
    });

    const handleOnline = () => {
      console.log('[Network] Internet connection RESTORED. Entering Synchronizing mode.');
      setIsOnline(true);
      setSyncStatus('syncing');
      processQueuedActions();
    };

    const handleOffline = () => {
      console.log('[Network] Internet connection LOST. Entering Offline Mode.');
      setIsOnline(false);
      setSyncStatus('offline');
      loadCachedData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic background sync every 3 minutes if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        refreshOfflineCache();
      }
    }, 180000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [loadCachedData, refreshOfflineCache, processQueuedActions]);

  // Public helper to queue offline action
  const queueAction = async (type, payload) => {
    const item = await queueOfflineAction(type, payload);
    // If online right now, attempt immediate push
    if (navigator.onLine) {
      processQueuedActions();
    }
    return item;
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncStatus, // 'online' | 'syncing' | 'offline'
        lastSyncTimestamp,
        cachedData,
        refreshOfflineCache,
        queueAction,
        loadCachedData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

