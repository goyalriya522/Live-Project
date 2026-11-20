import { openDB } from 'idb';

const DB_NAME = 'CampusBusOfflineDB';
const DB_VERSION = 1;

// Initialize IndexedDB stores
export const initOfflineDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('routes')) {
        db.createObjectStore('routes', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('buses')) {
        db.createObjectStore('buses', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('schedules')) {
        db.createObjectStore('schedules', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('lastLocations')) {
        db.createObjectStore('lastLocations', { keyPath: 'busId' });
      }
      if (!db.objectStoreNames.contains('queuedUpdates')) {
        db.createObjectStore('queuedUpdates', { keyPath: 'requestId' });
      }
    },
  });
};

// Save complete offline snapshot to IndexedDB
export const saveOfflineSnapshot = async (snapshot) => {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(
      ['metadata', 'routes', 'buses', 'schedules', 'lastLocations'],
      'readwrite'
    );

    // Save timestamp & settings
    await tx.objectStore('metadata').put({
      key: 'lastSyncTimestamp',
      value: snapshot.timestamp || new Date().toISOString(),
    });

    if (snapshot.systemSettings) {
      await tx.objectStore('metadata').put({
        key: 'systemSettings',
        value: snapshot.systemSettings,
      });
    }

    // Save routes
    if (snapshot.routes && Array.isArray(snapshot.routes)) {
      for (const route of snapshot.routes) {
        await tx.objectStore('routes').put(route);
      }
    }

    // Save buses and last locations
    if (snapshot.buses && Array.isArray(snapshot.buses)) {
      for (const bus of snapshot.buses) {
        await tx.objectStore('buses').put(bus);
        if (bus.lastKnownLocation) {
          await tx.objectStore('lastLocations').put({
            busId: bus._id,
            ...bus.lastKnownLocation,
            isLive: false, // Explicitly cached
            cachedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Save schedules
    if (snapshot.schedules && Array.isArray(snapshot.schedules)) {
      for (const schedule of snapshot.schedules) {
        await tx.objectStore('schedules').put(schedule);
      }
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error('[OfflineDB] Error saving snapshot:', error);
    return false;
  }
};

// Retrieve cached offline data
export const getCachedOfflineData = async () => {
  try {
    const db = await initOfflineDB();
    const routes = await db.getAll('routes');
    const buses = await db.getAll('buses');
    const schedules = await db.getAll('schedules');
    const lastLocations = await db.getAll('lastLocations');
    const syncTimeRecord = await db.get('metadata', 'lastSyncTimestamp');
    const systemSettingsRecord = await db.get('metadata', 'systemSettings');

    return {
      routes: routes || [],
      buses: buses || [],
      schedules: schedules || [],
      lastLocations: lastLocations || [],
      lastSyncTimestamp: syncTimeRecord ? syncTimeRecord.value : null,
      systemSettings: systemSettingsRecord ? systemSettingsRecord.value : null,
    };
  } catch (error) {
    console.error('[OfflineDB] Error reading cached data:', error);
    return {
      routes: [],
      buses: [],
      schedules: [],
      lastLocations: [],
      lastSyncTimestamp: null,
      systemSettings: null,
    };
  }
};

// Queue an action to synchronize later when online
export const queueOfflineAction = async (type, payload) => {
  try {
    const db = await initOfflineDB();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const actionItem = {
      requestId,
      type,
      payload,
      clientTimestamp: new Date().toISOString(),
    };
    await db.put('queuedUpdates', actionItem);
    return actionItem;
  } catch (error) {
    console.error('[OfflineDB] Failed to queue offline action:', error);
    return null;
  }
};

// Retrieve all pending queued offline actions
export const getQueuedOfflineActions = async () => {
  try {
    const db = await initOfflineDB();
    return await db.getAll('queuedUpdates');
  } catch (error) {
    console.error('[OfflineDB] Failed to fetch queued actions:', error);
    return [];
  }
};

// Clear queued offline actions after successful sync
export const clearSyncedOfflineActions = async (requestIds) => {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction('queuedUpdates', 'readwrite');
    for (const id of requestIds) {
      await tx.objectStore('queuedUpdates').delete(id);
    }
    await tx.done;
  } catch (error) {
    console.error('[OfflineDB] Failed to clear synced actions:', error);
  }
};

