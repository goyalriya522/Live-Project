const mongoose = require('mongoose');
const { store } = require('../utils/memoryStore');
const { calculateDistanceKm } = require('../services/gpsSimulationService');
const { notificationService } = require('../services/notificationService');
const User = require('../models/User');

// @desc    Get all available college buses for students to browse/select
// @route   GET /api/student/buses
// @access  Private (Student)
const getAvailableBuses = async (req, res, next) => {
  try {
    const busesWithDetails = store.buses.map((bus) => {
      const route = store.routes.find(
        (r) => String(r._id) === String(bus.assignedRoute) || String(r.assignedBus) === String(bus._id)
      );
      const driver = store.users.find(
        (u) => String(u._id) === String(bus.assignedDriver) || String(u.assignedBus) === String(bus._id)
      );
      const location = store.busLocations.find((l) => String(l.busId) === String(bus._id));
      const trip = store.trips.find(
        (t) => String(t._id) === String(bus.currentTrip) || (String(t.busId) === String(bus._id) && t.status !== 'completed' && t.status !== 'cancelled')
      );

      return {
        _id: bus._id,
        busNumber: bus.busNumber,
        registrationNumber: bus.registrationNumber,
        capacity: bus.capacity,
        model: bus.model,
        year: bus.year,
        status: bus.status,
        route: route
          ? {
              _id: route._id,
              name: route.name,
              routeNumber: route.routeNumber || (parseInt(route.routeCode?.replace(/\D/g, ''), 10) || null),
              destination: route.destination || route.name,
              routeCode: route.routeCode,
              startPoint: route.startPoint,
              endPoint: route.endPoint,
              isExamRoute: route.isExamRoute,
              stopsCount: route.stops ? route.stops.length : 0,
              stops: route.stops || [],
            }
          : null,
        driver: driver
          ? {
              _id: driver._id,
              name: driver.name,
              phone: driver.phone,
            }
          : null,
        tripStatus: trip ? trip.status : 'not_started',
        hasLiveLocation: !!(location && location.isLive),
      };
    });

    res.status(200).json({
      success: true,
      data: busesWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Select / assign a bus for student
// @route   POST /api/student/select-bus
// @access  Private (Student)
const selectBus = async (req, res, next) => {
  try {
    const { busId, selectedStop } = req.body;

    if (!busId) {
      return res.status(400).json({ success: false, message: 'Please provide busId.' });
    }

    const bus = store.buses.find((b) => String(b._id) === String(busId));
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }

    const route = store.routes.find(
      (r) => String(r._id) === String(bus.assignedRoute) || String(r.assignedBus) === String(bus._id)
    );

    const user = store.users.find((u) => String(u._id) === String(req.user._id));
    if (user) {
      user.assignedBus = bus._id;
      user.assignedRoute = route ? route._id : bus.assignedRoute;
      if (selectedStop) {
        user.selectedStop = selectedStop;
      }
    }

    // Persist to MongoDB if connected
    if (mongoose.connection.readyState === 1 && req.user?._id) {
      try {
        const updateFields = {};
        if (bus._id && mongoose.Types.ObjectId.isValid(bus._id)) {
          updateFields.assignedBus = bus._id;
        }
        if (route && route._id && mongoose.Types.ObjectId.isValid(route._id)) {
          updateFields.assignedRoute = route._id;
        }
        if (selectedStop) {
          updateFields.selectedStop = selectedStop;
        }

        const userQuery = mongoose.Types.ObjectId.isValid(req.user._id)
          ? { _id: req.user._id }
          : { email: req.user.email };

        await User.findOneAndUpdate(userQuery, { $set: updateFields });
      } catch (dbErr) {
        console.warn('[Student] Bus selection MongoDB notice:', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Assigned to ${bus.busNumber} (${route ? route.name : 'Assigned Route'}).`,
      data: {
        assignedBus: bus,
        assignedRoute: route,
        selectedStop: user ? user.selectedStop : selectedStop || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed student transit dashboard info
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getStudentDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    let bus = null;

    // 1. Priority: User's explicitly assigned bus
    if (user.assignedBus) {
      bus = store.buses.find((b) => String(b._id) === String(user.assignedBus));
    }
    // 2. Priority: User's assigned route -> find associated bus
    if (!bus && user.assignedRoute) {
      bus = store.buses.find(
        (b) => String(b.assignedRoute) === String(user.assignedRoute) || String(b._id) === String(user.assignedBus)
      );
    }
    // 3. Fallback: First available fleet bus if unassigned
    if (!bus && store.buses.length > 0) {
      bus = store.buses[0];
    }

    let route = null;
    if (bus) {
      route = store.routes.find(
        (r) => String(r._id) === String(bus.assignedRoute) || String(r.assignedBus) === String(bus._id)
      );
    }
    if (!route && user.assignedRoute) {
      route = store.routes.find((r) => String(r._id) === String(user.assignedRoute));
    }

    let driver = null;
    if (bus?.assignedDriver) {
      driver = store.users.find((u) => String(u._id) === String(bus.assignedDriver));
    }
    if (!driver && route?.assignedDriver) {
      driver = store.users.find((u) => String(u._id) === String(route.assignedDriver));
    }

    let trip = null;
    let location = null;
    let schedule = null;

    if (bus) {
      trip = store.trips.find(
        (t) => (String(t._id) === String(bus.currentTrip) || String(t.busId) === String(bus._id)) &&
               t.status !== 'completed' && t.status !== 'cancelled'
      );
      location = store.busLocations.find((l) => String(l.busId) === String(bus._id));
      schedule = store.schedules.find(
        (s) => (String(s.busId) === String(bus._id) || (route && String(s.routeId) === String(route._id))) && s.isActive
      );

      // If no location recorded yet but route has coordinates, provide default start coordinates
      if (!location && route) {
        const startCoord = (route.pathCoordinates && route.pathCoordinates.length > 0)
          ? route.pathCoordinates[0]
          : (route.stops && route.stops.length > 0)
          ? { lat: route.stops[0].lat, lng: route.stops[0].lng }
          : { lat: 30.2520, lng: 74.8860 };

        location = {
          busId: bus._id,
          latitude: startCoord.lat,
          longitude: startCoord.lng,
          speedKmH: 0,
          heading: 90,
          nextStopName: route.stops && route.stops[0] ? route.stops[0].name : 'Campus Terminus',
          nextStopOrder: 1,
          etaNextStopMinutes: 5,
          currentStopIndex: 0,
          pathProgressPercent: 0,
          isLive: false,
          isSimulated: true,
          lastUpdated: new Date(),
        };
      }
    }

    // Exam mode settings
    const systemSettings = store.systemSettings;

    // Notifications for student
    const notifications = notificationService.getNotificationsForUser(user);

    // Calculate dynamic ETAs for each stop along route
    let stopsWithEta = [];
    if (route && route.stops && route.stops.length > 0) {
      const busLat = location?.latitude != null ? location.latitude : (route.stops[0]?.lat || 30.2520);
      const busLng = location?.longitude != null ? location.longitude : (route.stops[0]?.lng || 74.8860);
      const speedKmH = location?.speedKmH && location.speedKmH > 5 ? location.speedKmH : 30;

      stopsWithEta = route.stops.map((stop, index) => {
        const sLat = stop.lat != null ? stop.lat : 30.2520;
        const sLng = stop.lng != null ? stop.lng : 74.8860;
        const distKm = calculateDistanceKm(busLat, busLng, sLat, sLng);
        const etaMinutes = Math.max(1, Math.round((distKm / speedKmH) * 60));
        const isPassed = (location?.currentStopIndex || 0) > index;
        const isNext = (location?.nextStopOrder || 1) === stop.order;

        return {
          ...stop,
          distanceFromBusKm: parseFloat(distKm.toFixed(2)),
          estimatedMinutesRemaining: isPassed ? 0 : etaMinutes,
          isPassed,
          isNext,
          status: isPassed ? 'passed' : isNext ? 'approaching' : 'upcoming',
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        assignedBus: bus,
        assignedRoute: route ? { ...route, stopsWithEta } : null,
        assignedDriver: driver
          ? {
              name: driver.name,
              phone: driver.phone,
              avatar: driver.avatar,
            }
          : null,
        currentTrip: trip,
        busLocation: location,
        schedule,
        systemSettings,
        selectedStop: user.selectedStop,
        notifications: notifications.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications for student
// @route   GET /api/student/notifications
// @access  Private (Student)
const getStudentNotifications = async (req, res, next) => {
  try {
    const notifications = notificationService.getNotificationsForUser(req.user);
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/student/notifications/:id/read
// @access  Private (Student)
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = store.notifications.find((n) => String(n._id) === String(id));
    if (notification) {
      if (!notification.readBy) notification.readBy = [];
      const userIdStr = String(req.user._id);
      if (!notification.readBy.includes(userIdStr)) {
        notification.readBy.push(userIdStr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableBuses,
  selectBus,
  getStudentDashboard,
  getStudentNotifications,
  markNotificationRead,
};

