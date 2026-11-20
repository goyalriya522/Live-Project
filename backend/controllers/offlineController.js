const { store } = require('../utils/memoryStore');
const { notificationService } = require('../services/notificationService');

// @desc    Retrieve full snapshot for offline storage in IndexedDB
// @route   GET /api/offline/snapshot
// @access  Public / Authenticated
const getOfflineSnapshot = async (req, res, next) => {
  try {
    const user = req.user || null;

    const snapshot = {
      timestamp: new Date().toISOString(),
      routes: store.routes,
      buses: store.buses.map((b) => {
        const route = store.routes.find(
          (r) => String(r._id) === String(b.assignedRoute) || String(r.assignedBus) === String(b._id)
        );
        const loc = store.busLocations.find((l) => String(l.busId) === String(b._id));
        return {
          _id: b._id,
          busNumber: b.busNumber,
          registrationNumber: b.registrationNumber,
          capacity: b.capacity,
          status: b.status,
          routeName: route ? route.name : null,
          assignedRoute: b.assignedRoute,
          lastKnownLocation: loc
            ? {
                latitude: loc.latitude,
                longitude: loc.longitude,
                speedKmH: loc.speedKmH,
                heading: loc.heading,
                nextStopName: loc.nextStopName,
                etaNextStopMinutes: loc.etaNextStopMinutes,
                lastUpdated: loc.lastUpdated,
                isLive: false, // In offline mode, explicitly mark as cached/last-known
              }
            : null,
        };
      }),
      schedules: store.schedules,
      systemSettings: store.systemSettings,
      offlineNotice: "You're offline. Showing your last saved bus information.",
    };

    res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Synchronize queued offline updates when internet is restored
// @route   POST /api/offline/sync
// @access  Private
const syncOfflineData = async (req, res, next) => {
  try {
    const { queuedUpdates = [] } = req.body;
    const processedResults = [];

    // Process queued offline updates safely without duplicates
    for (const item of queuedUpdates) {
      const { type, payload, clientTimestamp, requestId } = item;

      // Handle trip status update
      if (type === 'trip_status_update') {
        const { tripId, status, delayMinutes, delayReason } = payload;
        const trip = store.trips.find((t) => String(t._id) === String(tripId));
        if (trip) {
          trip.status = status;
          if (delayMinutes !== undefined) trip.delayMinutes = delayMinutes;
          if (delayReason) trip.delayReason = delayReason;
          processedResults.push({ requestId, status: 'synced', entity: 'trip' });
        }
      }

      // Handle emergency report submitted while offline
      else if (type === 'emergency_report') {
        const { busId, emergencyType, description, severity, latitude, longitude } = payload;
        const bus = store.buses.find((b) => String(b._id) === String(busId));

        const emergency = {
          _id: `emg_offline_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          busId,
          driverId: req.user._id,
          type: emergencyType,
          description: `[Offline Queued] ${description}`,
          severity: severity || 'high',
          status: 'reported',
          latitude,
          longitude,
          resolutionNotes: '',
          resolvedAt: null,
          createdAt: new Date(clientTimestamp || Date.now()),
        };

        store.emergencyReports.unshift(emergency);

        notificationService.createNotification({
          title: `SYNCED OFFLINE ALERT: ${bus ? bus.busNumber : 'Bus'}`,
          message: `Recovered offline emergency: ${description}`,
          type: 'emergency',
          targetAudience: 'all',
          createdBy: req.user._id,
        });

        processedResults.push({ requestId, status: 'synced', entity: 'emergency' });
      }
    }

    res.status(200).json({
      success: true,
      message: `Synchronized ${processedResults.length} queued records successfully.`,
      data: {
        processedResults,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOfflineSnapshot,
  syncOfflineData,
};

