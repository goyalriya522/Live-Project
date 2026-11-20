const mongoose = require('mongoose');
const { store } = require('../utils/memoryStore');
const { notificationService } = require('../services/notificationService');
const { gpsSimulator } = require('../services/gpsSimulationService');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const User = require('../models/User');
const Trip = require('../models/Trip');

// @desc    Get driver assigned bus, route and current active trip
// @route   GET /api/driver/dashboard
// @access  Private (Driver or Admin)
const getDriverDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    // 1. Resolve bus assigned to driver bidirectionally
    let bus = store.buses.find(
      (b) => String(b.assignedDriver) === String(user._id) || String(b._id) === String(user.assignedBus)
    );

    // 2. Resolve route assigned to driver or bus
    let route = null;
    if (bus?.assignedRoute) {
      route = store.routes.find((r) => String(r._id) === String(bus.assignedRoute));
    }
    if (!route && bus) {
      route = store.routes.find(
        (r) => String(r.assignedBus) === String(bus._id) || String(r.assignedDriver) === String(user._id)
      );
    }
    if (!route && user.assignedRoute) {
      route = store.routes.find((r) => String(r._id) === String(user.assignedRoute));
    }
    // If bus wasn't found directly, but driver has an assigned route that has an assigned bus:
    if (!bus && route?.assignedBus) {
      bus = store.buses.find((b) => String(b._id) === String(route.assignedBus));
    }
    if (!bus && route) {
      bus = store.buses.find((b) => String(b.assignedRoute) === String(route._id));
    }

    let currentTrip = null;
    let location = null;
    let schedule = null;

    if (bus) {
      currentTrip = store.trips.find(
        (t) => (String(t._id) === String(bus.currentTrip) || String(t.busId) === String(bus._id)) &&
               t.status !== 'completed' && t.status !== 'cancelled'
      );
      location = store.busLocations.find((l) => String(l.busId) === String(bus._id));
      schedule = store.schedules.find(
        (s) => (String(s.busId) === String(bus._id) || (route && String(s.routeId) === String(route._id))) && s.isActive
      );
    }

    res.status(200).json({
      success: true,
      data: {
        driver: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          licenseNumber: user.licenseNumber,
        },
        assignedBus: bus || null,
        assignedRoute: route || null,
        currentTrip: currentTrip || null,
        busLocation: location || null,
        schedule: schedule || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a trip
// @route   POST /api/driver/start-trip
// @access  Private (Driver or Admin)
const startTrip = async (req, res, next) => {
  try {
    const user = req.user;
    const { busId: reqBusId, routeId: reqRouteId } = req.body;

    let bus = store.buses.find(
      (b) =>
        String(b._id) === String(reqBusId) ||
        String(b.assignedDriver) === String(user._id) ||
        String(b._id) === String(user.assignedBus)
    );

    let route = null;
    if (reqRouteId) {
      route = store.routes.find((r) => String(r._id) === String(reqRouteId));
    }
    if (!route && bus?.assignedRoute) {
      route = store.routes.find((r) => String(r._id) === String(bus.assignedRoute));
    }
    if (!route && bus) {
      route = store.routes.find(
        (r) => String(r.assignedBus) === String(bus._id) || String(r.assignedDriver) === String(user._id)
      );
    }
    if (!route && user.assignedRoute) {
      route = store.routes.find((r) => String(r._id) === String(user.assignedRoute));
    }
    if (!bus && route?.assignedBus) {
      bus = store.buses.find((b) => String(b._id) === String(route.assignedBus));
    }
    if (!bus && route) {
      bus = store.buses.find((b) => String(b.assignedRoute) === String(route._id));
    }

    if (!bus) {
      return res.status(404).json({ success: false, message: 'No assigned bus found for this driver.' });
    }

    if (!route) {
      return res.status(404).json({ success: false, message: 'No route assigned to this bus or driver.' });
    }

    // Check if trip already started
    let existingTrip = store.trips.find(
      (t) => String(t.busId) === String(bus._id) && t.status !== 'completed' && t.status !== 'cancelled'
    );

    const newTripId = new mongoose.Types.ObjectId();
    if (existingTrip) {
      existingTrip.status = 'started';
      existingTrip.startTime = existingTrip.startTime || new Date();
    } else {
      existingTrip = {
        _id: newTripId.toString(),
        busId: bus._id,
        driverId: user._id,
        routeId: route._id,
        status: 'started',
        currentStopIndex: 0,
        startTime: new Date(),
        endTime: null,
        delayMinutes: 0,
        delayReason: '',
        notes: 'Trip initiated by driver',
        createdAt: new Date(),
      };
      store.trips.push(existingTrip);
    }

    bus.currentTrip = existingTrip._id;
    bus.status = 'on_trip';

    // Persist trip to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const cleanBusId = mongoose.Types.ObjectId.isValid(bus._id) ? bus._id : null;
        const cleanDriverId = mongoose.Types.ObjectId.isValid(user._id) ? user._id : null;
        const cleanRouteId = mongoose.Types.ObjectId.isValid(route._id) ? route._id : null;
        const cleanTripId = mongoose.Types.ObjectId.isValid(existingTrip._id) ? existingTrip._id : newTripId;

        if (cleanBusId && cleanDriverId && cleanRouteId) {
          await Trip.findOneAndUpdate(
            { _id: cleanTripId },
            {
              _id: cleanTripId,
              busId: cleanBusId,
              driverId: cleanDriverId,
              routeId: cleanRouteId,
              status: 'started',
              startTime: existingTrip.startTime,
            },
            { upsert: true, new: true }
          );

          await Bus.findByIdAndUpdate(cleanBusId, {
            currentTrip: cleanTripId,
            status: 'on_trip',
          });
        }
      } catch (dbErr) {
        console.warn('[Driver] Trip start MongoDB notice:', dbErr.message);
      }
    }

    // Reset GPS simulation state to start of route
    const startCoord = (route.pathCoordinates && route.pathCoordinates.length > 0)
      ? route.pathCoordinates[0]
      : (route.stops && route.stops.length > 0)
      ? { lat: route.stops[0].lat, lng: route.stops[0].lng }
      : { lat: 30.2520, lng: 74.8860 };

    let locRecord = store.busLocations.find((l) => String(l.busId) === String(bus._id));
    const locData = {
      busId: bus._id,
      tripId: existingTrip._id,
      latitude: startCoord.lat,
      longitude: startCoord.lng,
      speedKmH: 25,
      heading: 90,
      nextStopName: route.stops && route.stops[0] ? route.stops[0].name : 'Origin Terminus',
      nextStopOrder: 1,
      etaNextStopMinutes: 2,
      currentStopIndex: 0,
      pathProgressPercent: 5,
      isLive: true,
      isSimulated: true,
      lastUpdated: new Date(),
    };

    if (locRecord) {
      Object.assign(locRecord, locData);
    } else {
      store.busLocations.push({ _id: `loc_${bus._id}`, ...locData });
    }

    // Notify students and admin
    notificationService.createNotification({
      title: `${bus.busNumber} Trip Started`,
      message: `${bus.busNumber} has departed for route '${route.name}'. Live tracking is now active.`,
      type: 'info',
      targetAudience: 'bus',
      targetBusId: bus._id,
      targetRouteId: route._id,
      createdBy: user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Trip started successfully. Tracking activated.',
      data: {
        trip: existingTrip,
        bus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip status (not_started, started, on_route, approaching_stop, delayed, completed)
// @route   PUT /api/driver/trip-status
// @access  Private (Driver or Admin)
const updateTripStatus = async (req, res, next) => {
  try {
    const { status, delayMinutes, delayReason, nextStopName } = req.body;

    const allowedStatuses = ['not_started', 'started', 'on_route', 'approaching_stop', 'delayed', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`,
      });
    }

    const user = req.user;
    const bus = store.buses.find(
      (b) => String(b.assignedDriver) === String(user._id) || String(b._id) === String(user.assignedBus)
    );

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Assigned bus not found.' });
    }

    const trip = store.trips.find(
      (t) => String(t.busId) === String(bus._id) && t.status !== 'completed' && t.status !== 'cancelled'
    );

    if (!trip) {
      return res.status(404).json({ success: false, message: 'No active trip to update.' });
    }

    trip.status = status;

    if (delayMinutes !== undefined) {
      trip.delayMinutes = Number(delayMinutes);
    }
    if (delayReason) {
      trip.delayReason = delayReason;
    }

    if (status === 'completed') {
      trip.endTime = new Date();
      bus.status = 'active';
      bus.currentTrip = null;

      // Mark bus location as not live
      const loc = store.busLocations.find((l) => String(l.busId) === String(bus._id));
      if (loc) {
        loc.isLive = false;
        loc.speedKmH = 0;
      }

      // Persist in MongoDB
      if (mongoose.connection.readyState === 1) {
        try {
          if (mongoose.Types.ObjectId.isValid(trip._id)) {
            await Trip.findByIdAndUpdate(trip._id, {
              status: 'completed',
              endTime: trip.endTime,
              delayMinutes: trip.delayMinutes || 0,
              delayReason: trip.delayReason || '',
            });
          }
          if (mongoose.Types.ObjectId.isValid(bus._id)) {
            await Bus.findByIdAndUpdate(bus._id, {
              status: 'active',
              currentTrip: null,
            });
          }
        } catch (dbErr) {
          console.warn('[Driver] Trip complete MongoDB notice:', dbErr.message);
        }
      }

      notificationService.createNotification({
        title: `${bus.busNumber} Trip Completed`,
        message: `${bus.busNumber} has safely completed its route and reached the campus terminus.`,
        type: 'success',
        targetAudience: 'bus',
        targetBusId: bus._id,
        targetRouteId: trip.routeId,
        createdBy: user._id,
      });
    } else {
      // Persist status in MongoDB
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(trip._id)) {
        try {
          await Trip.findByIdAndUpdate(trip._id, {
            status,
            delayMinutes: trip.delayMinutes || 0,
            delayReason: trip.delayReason || '',
          });
        } catch (dbErr) {
          console.warn('[Driver] Trip update MongoDB notice:', dbErr.message);
        }
      }

      if (status === 'delayed') {
        notificationService.createNotification({
          title: `Bus Delay: ${bus.busNumber}`,
          message: `${bus.busNumber} is delayed by approx ${trip.delayMinutes || 10} min. Reason: ${trip.delayReason || 'Traffic congestion'}.`,
          type: 'delay',
          targetAudience: 'bus',
          targetBusId: bus._id,
          targetRouteId: trip.routeId,
          createdBy: user._id,
        });
      } else if (status === 'approaching_stop' && nextStopName) {
        const loc = store.busLocations.find((l) => String(l.busId) === String(bus._id));
        if (loc) {
          loc.nextStopName = nextStopName;
        }
        notificationService.createNotification({
          title: `${bus.busNumber} Approaching ${nextStopName}`,
          message: `${bus.busNumber} is within 2 minutes of stop '${nextStopName}'. Please be ready at the boarding zone.`,
          type: 'info',
          targetAudience: 'bus',
          targetBusId: bus._id,
          targetRouteId: trip.routeId,
          createdBy: user._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Trip status updated to '${status}'.`,
      data: {
        trip,
        bus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report emergency from driver cockpit
// @route   POST /api/driver/emergency
// @access  Private (Driver or Admin)
const reportEmergency = async (req, res, next) => {
  try {
    const { type, description, severity = 'high', latitude, longitude } = req.body;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Emergency type and description are required.',
      });
    }

    const user = req.user;
    const bus = store.buses.find(
      (b) => String(b.assignedDriver) === String(user._id) || String(b._id) === String(user.assignedBus)
    );

    if (!bus) {
      return res.status(404).json({ success: false, message: 'No assigned bus found.' });
    }

    const trip = store.trips.find(
      (t) => String(t.busId) === String(bus._id) && t.status !== 'completed' && t.status !== 'cancelled'
    );

    const busLoc = store.busLocations.find((l) => String(l.busId) === String(bus._id));

    const emergency = {
      _id: `emg_${Date.now()}`,
      busId: bus._id,
      tripId: trip ? trip._id : null,
      driverId: user._id,
      type, // 'breakdown', 'accident', 'obstruction', 'delay', 'medical', 'other'
      description,
      severity, // 'low', 'medium', 'high', 'critical'
      status: 'reported',
      latitude: latitude || (busLoc ? busLoc.latitude : null),
      longitude: longitude || (busLoc ? busLoc.longitude : null),
      resolutionNotes: '',
      resolvedAt: null,
      createdAt: new Date(),
    };

    store.emergencyReports.unshift(emergency);

    // Update bus status if breakdown or accident
    if (type === 'breakdown' || type === 'accident') {
      bus.status = 'maintenance';
      if (trip) trip.status = 'delayed';
    }

    // Broadcast High-Priority Alert to Admins and Students
    notificationService.createNotification({
      title: `EMERGENCY ALERT: ${bus.busNumber} (${type.toUpperCase()})`,
      message: `Emergency reported for ${bus.busNumber}: ${description}. Transport administration has been alerted immediately.`,
      type: 'emergency',
      targetAudience: 'all',
      targetBusId: bus._id,
      targetRouteId: trip ? trip.routeId : bus.assignedRoute,
      createdBy: user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Emergency incident reported. Control room notified.',
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDriverDashboard,
  startTrip,
  updateTripStatus,
  reportEmergency,
};

