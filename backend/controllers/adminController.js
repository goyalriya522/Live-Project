const { store } = require('../utils/memoryStore');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { notificationService } = require('../services/notificationService');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Schedule = require('../models/Schedule');
const Trip = require('../models/Trip');

// Helpers to reliably resolve identifiers to valid MongoDB ObjectIds
const resolveDriverObjectId = async (idOrVal) => {
  if (!idOrVal) return null;
  if (mongoose.Types.ObjectId.isValid(idOrVal)) return idOrVal;
  const storeUser = store.users.find((u) => String(u._id) === String(idOrVal) || u.email === String(idOrVal));
  if (storeUser && mongoose.Types.ObjectId.isValid(storeUser._id)) return storeUser._id;
  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await User.findOne({
        $or: [
          ...(storeUser?.email ? [{ email: storeUser.email }] : []),
          { email: idOrVal },
        ],
      }).lean();
      if (dbUser) return dbUser._id;
    } catch (_) {}
  }
  return null;
};

const resolveRouteObjectId = (idOrVal) => {
  if (!idOrVal) return null;
  if (mongoose.Types.ObjectId.isValid(idOrVal)) return idOrVal;
  const storeRoute = store.routes.find((r) => String(r._id) === String(idOrVal) || String(r.routeNumber) === String(idOrVal));
  if (storeRoute && mongoose.Types.ObjectId.isValid(storeRoute._id)) return storeRoute._id;
  return null;
};

const resolveBusObjectId = (idOrVal) => {
  if (!idOrVal) return null;
  if (mongoose.Types.ObjectId.isValid(idOrVal)) return idOrVal;
  const storeBus = store.buses.find((b) => String(b._id) === String(idOrVal) || b.busNumber === String(idOrVal));
  if (storeBus && mongoose.Types.ObjectId.isValid(storeBus._id)) return storeBus._id;
  return null;
};

// @desc    Get complete administrative fleet overview stats
// @route   GET /api/admin/overview
// @access  Private (Admin)
const getAdminOverview = async (req, res, next) => {
  try {
    const totalBuses = store.buses.length;
    const activeBuses = store.buses.filter((b) => b.status === 'active' || b.status === 'on_trip').length;
    const totalDrivers = store.users.filter((u) => u.role === 'driver').length;
    const totalStudents = store.users.filter((u) => u.role === 'student').length;
    const totalRoutes = store.routes.length;
    const activeTrips = store.trips.filter((t) => t.status === 'started' || t.status === 'on_route' || t.status === 'approaching_stop');
    const delayedTrips = store.trips.filter((t) => t.status === 'delayed' || (t.delayMinutes && t.delayMinutes > 0));
    const activeEmergencies = store.emergencyReports.filter((e) => e.status !== 'resolved');

    // Compile active fleet locations
    const fleetMapData = store.buses.map((bus) => {
      const loc = store.busLocations.find((l) => String(l.busId) === String(bus._id));
      const route = store.routes.find(
        (r) => String(r._id) === String(bus.assignedRoute) || String(r.assignedBus) === String(bus._id)
      );
      const driver = store.users.find(
        (u) => String(u._id) === String(bus.assignedDriver) || String(u.assignedBus) === String(bus._id)
      );
      const trip = store.trips.find(
        (t) => String(t._id) === String(bus.currentTrip) || (String(t.busId) === String(bus._id) && t.status !== 'completed' && t.status !== 'cancelled')
      );

      return {
        busId: bus._id,
        busNumber: bus.busNumber,
        registrationNumber: bus.registrationNumber,
        status: bus.status,
        model: bus.model,
        capacity: bus.capacity,
        driver: driver ? { name: driver.name, phone: driver.phone } : null,
        route: route ? { name: route.name, routeCode: route.routeCode } : null,
        trip: trip ? { status: trip.status, delayMinutes: trip.delayMinutes } : null,
        location: loc || null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBuses,
          activeBuses,
          totalDrivers,
          totalStudents,
          totalRoutes,
          activeTripsCount: activeTrips.length,
          delayedTripsCount: delayedTrips.length,
          activeEmergenciesCount: activeEmergencies.length,
          examModeActive: store.systemSettings.examModeEnabled,
        },
        fleetMapData,
        systemSettings: store.systemSettings,
        recentEmergencies: store.emergencyReports.slice(0, 5),
        recentNotifications: store.notifications.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== BUS MANAGEMENT ====================

const getBuses = async (req, res, next) => {
  try {
    const buses = store.buses.map((b) => {
      const driver = store.users.find(
        (u) => String(u._id) === String(b.assignedDriver) || String(u.assignedBus) === String(b._id)
      );
      const route = store.routes.find(
        (r) => String(r._id) === String(b.assignedRoute) || String(r.assignedBus) === String(b._id)
      );
      return {
        ...b,
        driverName: driver ? driver.name : 'Unassigned',
        driverId: driver ? driver._id : null,
        routeName: route ? (route.routeNumber ? `Route ${route.routeNumber} — ${route.destination || route.name}` : route.name) : 'Unassigned',
        routeId: route ? route._id : null,
      };
    });
    res.status(200).json({ success: true, data: buses });
  } catch (error) {
    next(error);
  }
};

const createBus = async (req, res, next) => {
  try {
    const { busNumber, registrationNumber, capacity, model, year, assignedDriver, assignedRoute, status } = req.body;

    if (!busNumber || !registrationNumber) {
      return res.status(400).json({ success: false, message: 'Bus number and registration number are required.' });
    }

    const busExists = store.buses.find(
      (b) => b.busNumber.toUpperCase() === busNumber.toUpperCase() || b.registrationNumber.toUpperCase() === registrationNumber.toUpperCase()
    );

    if (busExists) {
      return res.status(400).json({ success: false, message: 'A bus with this number or registration already exists.' });
    }

    const newBusId = new mongoose.Types.ObjectId();
    const cleanDriverId = await resolveDriverObjectId(assignedDriver);
    const cleanRouteId = resolveRouteObjectId(assignedRoute);

    if (mongoose.connection.readyState === 1) {
      try {
        await Bus.create({
          _id: newBusId,
          busNumber: busNumber.toUpperCase().trim(),
          registrationNumber: registrationNumber.toUpperCase().trim(),
          capacity: Number(capacity) || 50,
          model: model || 'Standard Bus',
          year: Number(year) || 2023,
          status: status || 'active',
          assignedDriver: cleanDriverId,
          assignedRoute: cleanRouteId,
        });

        if (cleanDriverId) {
          await User.findByIdAndUpdate(cleanDriverId, {
            assignedBus: newBusId,
            ...(cleanRouteId ? { assignedRoute: cleanRouteId } : {}),
          });
        }
        if (cleanRouteId) {
          await Route.findByIdAndUpdate(cleanRouteId, {
            assignedBus: newBusId,
            ...(cleanDriverId ? { assignedDriver: cleanDriverId } : {}),
          });
        }
      } catch (dbErr) {
        console.warn('[Admin] Bus creation MongoDB notice:', dbErr.message);
      }
    }

    const newBus = {
      _id: newBusId.toString(),
      busNumber: busNumber.toUpperCase().trim(),
      registrationNumber: registrationNumber.toUpperCase().trim(),
      capacity: Number(capacity) || 50,
      model: model || 'Standard Bus',
      year: Number(year) || 2023,
      status: status || 'active',
      assignedDriver: cleanDriverId || assignedDriver || null,
      assignedRoute: cleanRouteId || assignedRoute || null,
      currentTrip: null,
      createdAt: new Date(),
    };

    store.buses.push(newBus);

    // Sync driver in store
    if (assignedDriver) {
      const driver = store.users.find((u) => String(u._id) === String(assignedDriver));
      if (driver) {
        driver.assignedBus = newBus._id;
        if (assignedRoute) driver.assignedRoute = assignedRoute;
      }
    }
    // Sync route in store
    if (assignedRoute) {
      const route = store.routes.find((r) => String(r._id) === String(assignedRoute));
      if (route) {
        route.assignedBus = newBus._id;
        if (assignedDriver) route.assignedDriver = assignedDriver;
      }
    }

    res.status(201).json({ success: true, message: 'Bus registered successfully.', data: newBus });
  } catch (error) {
    next(error);
  }
};

const updateBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bus = store.buses.find((b) => String(b._id) === String(id));

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }

    const { busNumber, registrationNumber, capacity, model, year, assignedDriver, assignedRoute, status } = req.body;

    if (busNumber) bus.busNumber = busNumber.toUpperCase().trim();
    if (registrationNumber) bus.registrationNumber = registrationNumber.toUpperCase().trim();
    if (capacity !== undefined) bus.capacity = Number(capacity);
    if (model) bus.model = model;
    if (year !== undefined) bus.year = Number(year);
    if (status) bus.status = status;
    if (assignedDriver !== undefined) bus.assignedDriver = assignedDriver || null;
    if (assignedRoute !== undefined) bus.assignedRoute = assignedRoute || null;

    const cleanDriverId = await resolveDriverObjectId(bus.assignedDriver);
    const cleanRouteId = resolveRouteObjectId(bus.assignedRoute);

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Bus.findByIdAndUpdate(id, {
          busNumber: bus.busNumber,
          registrationNumber: bus.registrationNumber,
          capacity: bus.capacity,
          model: bus.model,
          year: bus.year,
          status: bus.status,
          assignedDriver: cleanDriverId,
          assignedRoute: cleanRouteId,
        });

        if (cleanDriverId) {
          await User.findByIdAndUpdate(cleanDriverId, {
            assignedBus: id,
            ...(cleanRouteId ? { assignedRoute: cleanRouteId } : {}),
          });
        }
        if (cleanRouteId) {
          await Route.findByIdAndUpdate(cleanRouteId, {
            assignedBus: id,
            ...(cleanDriverId ? { assignedDriver: cleanDriverId } : {}),
          });
        }
      } catch (dbErr) {
        console.warn('[Admin] Bus update MongoDB notice:', dbErr.message);
      }
    }

    // Sync driver in store
    if (assignedDriver) {
      const driver = store.users.find((u) => String(u._id) === String(assignedDriver));
      if (driver) {
        driver.assignedBus = bus._id;
        if (bus.assignedRoute) driver.assignedRoute = bus.assignedRoute;
      }
    }
    // Sync route in store
    if (assignedRoute) {
      const route = store.routes.find((r) => String(r._id) === String(assignedRoute));
      if (route) {
        route.assignedBus = bus._id;
        if (assignedDriver) route.assignedDriver = assignedDriver;
      }
    }

    res.status(200).json({ success: true, message: 'Bus updated successfully.', data: bus });
  } catch (error) {
    next(error);
  }
};

const deleteBus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const index = store.buses.findIndex((b) => String(b._id) === String(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }

    const deletedBus = store.buses.splice(index, 1)[0];

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Bus.findByIdAndDelete(id);
        await User.updateMany({ assignedBus: id }, { $set: { assignedBus: null } });
        await Route.updateMany({ assignedBus: id }, { $set: { assignedBus: null } });
      } catch (dbErr) {
        console.warn('[Admin] Bus delete MongoDB notice:', dbErr.message);
      }
    }

    // Unassign in store
    store.users.forEach((u) => {
      if (String(u.assignedBus) === String(id)) u.assignedBus = null;
    });
    store.routes.forEach((r) => {
      if (String(r.assignedBus) === String(id)) r.assignedBus = null;
    });

    res.status(200).json({ success: true, message: 'Bus removed from active fleet.', data: deletedBus });
  } catch (error) {
    next(error);
  }
};

// ==================== DRIVER MANAGEMENT ====================

const getDrivers = async (req, res, next) => {
  try {
    const drivers = store.users
      .filter((u) => u.role === 'driver')
      .map((d) => {
        const bus = store.buses.find(
          (b) => String(b._id) === String(d.assignedBus) || String(b.assignedDriver) === String(d._id)
        );
        const route = store.routes.find(
          (r) => String(r._id) === String(d.assignedRoute) || (bus && String(r._id) === String(bus.assignedRoute))
        );
        const safe = { ...d };
        delete safe.password;
        return {
          ...safe,
          busNumber: bus ? bus.busNumber : 'Unassigned',
          busId: bus ? bus._id : null,
          routeName: route ? (route.routeNumber ? `Route ${route.routeNumber} — ${route.destination || route.name}` : route.name) : 'Unassigned',
          routeId: route ? route._id : null,
        };
      });

    res.status(200).json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
};

const createDriver = async (req, res, next) => {
  try {
    const { name, email, password, phone, licenseNumber, assignedBus, assignedRoute } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const emailLower = email.toLowerCase().trim();
    if (store.users.some((u) => u.email === emailLower)) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const newDriverId = new mongoose.Types.ObjectId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanBusId = assignedBus && mongoose.Types.ObjectId.isValid(assignedBus) ? assignedBus : null;
    const cleanRouteId = assignedRoute && mongoose.Types.ObjectId.isValid(assignedRoute) ? assignedRoute : null;

    if (mongoose.connection.readyState === 1) {
      try {
        await User.create({
          _id: newDriverId,
          name,
          email: emailLower,
          password: hashedPassword,
          role: 'driver',
          phone: phone || '',
          licenseNumber: licenseNumber || '',
          assignedBus: cleanBusId,
          assignedRoute: cleanRouteId,
          isActive: true,
        });

        if (cleanBusId) {
          await Bus.findByIdAndUpdate(cleanBusId, {
            assignedDriver: newDriverId,
            ...(cleanRouteId ? { assignedRoute: cleanRouteId } : {}),
          });
        }
        if (cleanRouteId) {
          await Route.findByIdAndUpdate(cleanRouteId, {
            assignedDriver: newDriverId,
            ...(cleanBusId ? { assignedBus: cleanBusId } : {}),
          });
        }
      } catch (dbErr) {
        console.warn('[Admin] Driver creation MongoDB notice:', dbErr.message);
      }
    }

    const newDriver = {
      _id: newDriverId.toString(),
      name,
      email: emailLower,
      password: hashedPassword,
      role: 'driver',
      phone: phone || '',
      licenseNumber: licenseNumber || '',
      assignedBus: cleanBusId || assignedBus || null,
      assignedRoute: cleanRouteId || assignedRoute || null,
      isActive: true,
      avatar: null,
      createdAt: new Date(),
    };

    store.users.push(newDriver);

    // If bus provided, link bus to this driver
    if (assignedBus) {
      const bus = store.buses.find((b) => String(b._id) === String(assignedBus));
      if (bus) {
        bus.assignedDriver = newDriver._id;
        if (assignedRoute) bus.assignedRoute = assignedRoute;
      }
    }
    if (assignedRoute) {
      const route = store.routes.find((r) => String(r._id) === String(assignedRoute));
      if (route) {
        route.assignedDriver = newDriver._id;
        if (assignedBus) route.assignedBus = assignedBus;
      }
    }

    const safe = { ...newDriver };
    delete safe.password;

    res.status(201).json({ success: true, message: 'Driver registered successfully.', data: safe });
  } catch (error) {
    next(error);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const driver = store.users.find((u) => String(u._id) === String(id) && u.role === 'driver');

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    const { name, phone, licenseNumber, assignedBus, assignedRoute, isActive } = req.body;

    if (name) driver.name = name;
    if (phone !== undefined) driver.phone = phone;
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
    if (assignedBus !== undefined) driver.assignedBus = assignedBus;
    if (assignedRoute !== undefined) driver.assignedRoute = assignedRoute;
    if (isActive !== undefined) driver.isActive = isActive;

    const cleanBusId = driver.assignedBus && mongoose.Types.ObjectId.isValid(driver.assignedBus) ? driver.assignedBus : null;
    const cleanRouteId = driver.assignedRoute && mongoose.Types.ObjectId.isValid(driver.assignedRoute) ? driver.assignedRoute : null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await User.findByIdAndUpdate(id, {
          name: driver.name,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          assignedBus: cleanBusId,
          assignedRoute: cleanRouteId,
          isActive: driver.isActive,
        });

        if (cleanBusId) {
          await Bus.findByIdAndUpdate(cleanBusId, {
            assignedDriver: id,
            ...(cleanRouteId ? { assignedRoute: cleanRouteId } : {}),
          });
        }
        if (cleanRouteId) {
          await Route.findByIdAndUpdate(cleanRouteId, {
            assignedDriver: id,
            ...(cleanBusId ? { assignedBus: cleanBusId } : {}),
          });
        }
      } catch (dbErr) {
        console.warn('[Admin] Driver update MongoDB notice:', dbErr.message);
      }
    }

    if (assignedBus) {
      const bus = store.buses.find((b) => String(b._id) === String(assignedBus));
      if (bus) {
        bus.assignedDriver = driver._id;
        if (driver.assignedRoute) bus.assignedRoute = driver.assignedRoute;
      }
    }
    if (assignedRoute) {
      const route = store.routes.find((r) => String(r._id) === String(assignedRoute));
      if (route) {
        route.assignedDriver = driver._id;
        if (driver.assignedBus) route.assignedBus = driver.assignedBus;
      }
    }

    const safe = { ...driver };
    delete safe.password;

    res.status(200).json({ success: true, message: 'Driver record updated.', data: safe });
  } catch (error) {
    next(error);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const index = store.users.findIndex((u) => String(u._id) === String(id) && u.role === 'driver');

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    const deleted = store.users.splice(index, 1)[0];
    const safe = { ...deleted };
    delete safe.password;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await User.findByIdAndDelete(id);
        await Bus.updateMany({ assignedDriver: id }, { $set: { assignedDriver: null } });
        await Route.updateMany({ assignedDriver: id }, { $set: { assignedDriver: null } });
      } catch (dbErr) {
        console.warn('[Admin] Driver delete MongoDB notice:', dbErr.message);
      }
    }

    // Unassign driver from any assigned bus
    store.buses.forEach((b) => {
      if (String(b.assignedDriver) === String(id)) {
        b.assignedDriver = null;
      }
    });
    store.routes.forEach((r) => {
      if (String(r.assignedDriver) === String(id)) {
        r.assignedDriver = null;
      }
    });

    res.status(200).json({ success: true, message: 'Driver deleted successfully.', data: safe });
  } catch (error) {
    next(error);
  }
};

// ==================== ROUTE & STOP MANAGEMENT ====================

const getRoutes = async (req, res, next) => {
  try {
    const routesWithDetails = store.routes.map((r) => {
      // Find bus assigned to this route or linked by ID
      const bus = store.buses.find(
        (b) => String(b.assignedRoute) === String(r._id) || String(b._id) === String(r.assignedBus)
      );
      // Find driver assigned to that bus or route
      const driverId = bus ? bus.assignedDriver : r.assignedDriver;
      const driver = driverId ? store.users.find((u) => String(u._id) === String(driverId)) : null;

      return {
        ...r,
        routeNumber: r.routeNumber || (parseInt(r.routeCode?.replace(/\D/g, ''), 10) || null),
        destination: r.destination || r.name,
        busNumber: bus ? bus.busNumber : 'Unassigned',
        busRegistration: bus ? bus.registrationNumber : '',
        busId: bus ? bus._id : null,
        driverName: driver ? driver.name : 'Unassigned',
        driverPhone: driver ? driver.phone : '',
        driverId: driver ? driver._id : null,
        stopsCount: r.stops ? r.stops.length : 0,
      };
    });

    // Sort by routeNumber if present
    routesWithDetails.sort((a, b) => (a.routeNumber || 999) - (b.routeNumber || 999));

    res.status(200).json({ success: true, data: routesWithDetails });
  } catch (error) {
    next(error);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const {
      name,
      routeNumber,
      destination,
      routeCode,
      description,
      startPoint,
      endPoint,
      totalDistanceKm,
      estimatedDurationMinutes,
      stops,
      pathCoordinates,
      assignedBus,
      assignedDriver,
      isExamRoute,
      isActive,
    } = req.body;

    const rNum = routeNumber ? Number(routeNumber) : (parseInt(routeCode?.replace(/\D/g, ''), 10) || null);
    const code = routeCode ? routeCode.trim() : (rNum ? `Route ${rNum}` : name);

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Route name/destination and Route Number/Code are required.' });
    }

    const existingCode = store.routes.find((r) => r.routeCode?.toUpperCase() === code.toUpperCase());
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Route with code "${code}" already exists.` });
    }

    // Default endpoint to Campus Terminus if not specified
    const finalStart = startPoint || (stops && stops[0]?.name) || 'City Origin';
    const finalEnd = endPoint || 'Campus Terminus';

    const newRouteId = new mongoose.Types.ObjectId();
    const cleanBusId = resolveBusObjectId(assignedBus);
    const cleanDriverId = await resolveDriverObjectId(assignedDriver);

    // Format stops for schema compatibility with Bathinda-to-BFGI corridor coordinates
    const totalStops = (stops || []).length;
    const formattedStops = (stops || []).map((s, idx) => {
      const fraction = totalStops > 1 ? idx / (totalStops - 1) : 0;
      const defaultLat = 30.2110 + (30.2520 - 30.2110) * fraction;
      const defaultLng = 74.9455 + (74.8860 - 74.9455) * fraction;

      return {
        stopId: s.stopId || `stop_${idx + 1}`,
        order: s.order || idx + 1,
        name: s.name,
        landmark: s.landmark || '',
        lat: Number(s.lat) || parseFloat(defaultLat.toFixed(5)),
        lng: Number(s.lng) || parseFloat(defaultLng.toFixed(5)),
        estimatedMinutesFromStart: Number(s.estimatedMinutesFromStart) || (idx * 6),
        morningPickupTime: s.morningPickupTime || '07:30 AM',
        eveningDropTime: s.eveningDropTime || '05:30 PM',
      };
    });

    // Construct path from stops if not explicitly given
    const finalCoords = pathCoordinates && pathCoordinates.length > 0
      ? pathCoordinates
      : formattedStops.length > 0
      ? formattedStops.map((s) => ({ lat: s.lat, lng: s.lng }))
      : [
          { lat: 30.2110, lng: 74.9455 }, // Bathinda City
          { lat: 30.2520, lng: 74.8860 }, // BFGI Campus
        ];

    if (mongoose.connection.readyState === 1) {
      try {
        await Route.create({
          _id: newRouteId,
          name: name.trim(),
          routeNumber: rNum,
          destination: destination || name.trim(),
          routeCode: code,
          description: description || '',
          startPoint: finalStart,
          endPoint: finalEnd,
          totalDistanceKm: Number(totalDistanceKm) || 20.0,
          estimatedDurationMinutes: Number(estimatedDurationMinutes) || 45,
          isExamRoute: !!isExamRoute,
          isActive: isActive !== undefined ? !!isActive : true,
          assignedBus: cleanBusId,
          assignedDriver: cleanDriverId,
          stops: formattedStops,
          pathCoordinates: finalCoords,
        });

        if (cleanBusId) {
          await Bus.findByIdAndUpdate(cleanBusId, {
            assignedRoute: newRouteId,
            ...(cleanDriverId ? { assignedDriver: cleanDriverId } : {}),
          });
        }
        if (cleanDriverId) {
          await User.findByIdAndUpdate(cleanDriverId, {
            assignedRoute: newRouteId,
            ...(cleanBusId ? { assignedBus: cleanBusId } : {}),
          });
        }
      } catch (dbErr) {
        console.warn('[Admin] Route creation MongoDB notice:', dbErr.message);
      }
    }

    const newRoute = {
      _id: newRouteId.toString(),
      name: name.trim(),
      routeNumber: rNum,
      destination: destination || name.trim(),
      routeCode: code,
      description: description || '',
      startPoint: finalStart,
      endPoint: finalEnd,
      totalDistanceKm: Number(totalDistanceKm) || 20.0,
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || 45,
      isExamRoute: !!isExamRoute,
      isActive: isActive !== undefined ? !!isActive : true,
      assignedBus: cleanBusId || assignedBus || null,
      assignedDriver: cleanDriverId || assignedDriver || null,
      stops: formattedStops,
      pathCoordinates: finalCoords,
      createdAt: new Date(),
    };

    store.routes.push(newRoute);

    // Sync assigned bus and driver in store
    if (assignedBus) {
      const bus = store.buses.find((b) => String(b._id) === String(assignedBus));
      if (bus) {
        bus.assignedRoute = newRoute._id;
        if (assignedDriver) bus.assignedDriver = assignedDriver;
      }
    }
    if (assignedDriver) {
      const driver = store.users.find((u) => String(u._id) === String(assignedDriver));
      if (driver) {
        driver.assignedRoute = newRoute._id;
        if (assignedBus) driver.assignedBus = assignedBus;
      }
    }

    res.status(201).json({ success: true, message: 'Route configured successfully.', data: newRoute });
  } catch (error) {
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const route = store.routes.find((r) => String(r._id) === String(id));

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    const {
      name,
      routeNumber,
      destination,
      routeCode,
      description,
      startPoint,
      endPoint,
      totalDistanceKm,
      estimatedDurationMinutes,
      stops,
      pathCoordinates,
      assignedBus,
      assignedDriver,
      isExamRoute,
      isActive,
    } = req.body;

    if (name) route.name = name.trim();
    if (routeNumber !== undefined) route.routeNumber = Number(routeNumber);
    if (destination !== undefined) route.destination = destination;
    if (routeCode) route.routeCode = routeCode.trim();
    if (description !== undefined) route.description = description;
    if (startPoint) route.startPoint = startPoint;
    if (endPoint) route.endPoint = endPoint;
    if (totalDistanceKm !== undefined) route.totalDistanceKm = Number(totalDistanceKm);
    if (estimatedDurationMinutes !== undefined) route.estimatedDurationMinutes = Number(estimatedDurationMinutes);
    if (stops) {
      const totalStops = stops.length;
      route.stops = stops.map((s, idx) => {
        const fraction = totalStops > 1 ? idx / (totalStops - 1) : 0;
        const defaultLat = 30.2110 + (30.2520 - 30.2110) * fraction;
        const defaultLng = 74.9455 + (74.8860 - 74.9455) * fraction;

        return {
          stopId: s.stopId || `stop_${idx + 1}`,
          order: s.order || idx + 1,
          name: s.name,
          landmark: s.landmark || '',
          lat: Number(s.lat) || parseFloat(defaultLat.toFixed(5)),
          lng: Number(s.lng) || parseFloat(defaultLng.toFixed(5)),
          estimatedMinutesFromStart: Number(s.estimatedMinutesFromStart) || (idx * 6),
          morningPickupTime: s.morningPickupTime || '07:30 AM',
          eveningDropTime: s.eveningDropTime || '05:30 PM',
        };
      });
      if (!pathCoordinates || pathCoordinates.length === 0) {
        route.pathCoordinates = route.stops.map((s) => ({ lat: s.lat, lng: s.lng }));
      }
    }
    if (pathCoordinates) route.pathCoordinates = pathCoordinates;
    if (isExamRoute !== undefined) route.isExamRoute = isExamRoute;
    if (isActive !== undefined) route.isActive = isActive;
    if (assignedBus !== undefined) route.assignedBus = assignedBus || null;
    if (assignedDriver !== undefined) route.assignedDriver = assignedDriver || null;

    const cleanBusId = resolveBusObjectId(route.assignedBus);
    const cleanDriverId = await resolveDriverObjectId(route.assignedDriver);

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Route.findByIdAndUpdate(id, {
          name: route.name,
          routeNumber: route.routeNumber,
          destination: route.destination,
          routeCode: route.routeCode,
          description: route.description,
          startPoint: route.startPoint,
          endPoint: route.endPoint,
          totalDistanceKm: route.totalDistanceKm,
          estimatedDurationMinutes: route.estimatedDurationMinutes,
          stops: route.stops,
          pathCoordinates: route.pathCoordinates,
          isExamRoute: route.isExamRoute,
          isActive: route.isActive,
          assignedBus: cleanBusId,
          assignedDriver: cleanDriverId,
        });

        if (cleanBusId) {
          await Bus.findByIdAndUpdate(cleanBusId, {
            assignedRoute: id,
            ...(cleanDriverId ? { assignedDriver: cleanDriverId } : {}),
          });
        }
        if (cleanDriverId) {
          await User.findByIdAndUpdate(cleanDriverId, {
            assignedRoute: id,
            ...(cleanBusId ? { assignedBus: cleanBusId } : {}),
          });
        }
      } catch (dbErr) {
        console.warn('[Admin] Route update MongoDB notice:', dbErr.message);
      }
    }

    if (assignedBus) {
      const bus = store.buses.find((b) => String(b._id) === String(assignedBus));
      if (bus) {
        bus.assignedRoute = route._id;
        if (assignedDriver) bus.assignedDriver = assignedDriver;
      }
    }
    if (assignedDriver) {
      const driver = store.users.find((u) => String(u._id) === String(assignedDriver));
      if (driver) {
        driver.assignedRoute = route._id;
        if (assignedBus) driver.assignedBus = assignedBus;
      }
    }

    res.status(200).json({ success: true, message: 'Route updated successfully.', data: route });
  } catch (error) {
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const index = store.routes.findIndex((r) => String(r._id) === String(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    const deleted = store.routes.splice(index, 1)[0];

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Route.findByIdAndDelete(id);
        await Bus.updateMany({ assignedRoute: id }, { $set: { assignedRoute: null } });
        await User.updateMany({ assignedRoute: id }, { $set: { assignedRoute: null } });
      } catch (dbErr) {
        console.warn('[Admin] Route delete MongoDB notice:', dbErr.message);
      }
    }

    // Unassign route from buses
    store.buses.forEach((b) => {
      if (String(b.assignedRoute) === String(id)) {
        b.assignedRoute = null;
      }
    });

    // Unassign route from users
    store.users.forEach((u) => {
      if (String(u.assignedRoute) === String(id)) {
        u.assignedRoute = null;
      }
    });

    res.status(200).json({ success: true, message: 'Route removed successfully.', data: deleted });
  } catch (error) {
    next(error);
  }
};

// ==================== SCHEDULE MANAGEMENT ====================

const getSchedules = async (req, res, next) => {
  try {
    const schedules = store.schedules.map((s) => {
      const bus = store.buses.find((b) => String(b._id) === String(s.busId));
      const route = store.routes.find((r) => String(r._id) === String(s.routeId));
      return {
        ...s,
        busNumber: bus ? bus.busNumber : 'Unassigned',
        routeName: route ? route.name : 'Unassigned',
      };
    });
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const { title, routeId, busId, departureTime, estimatedArrivalTime, shift, daysOfWeek, isExamSchedule } = req.body;

    if (!title || !routeId || !busId || !departureTime || !estimatedArrivalTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required schedule fields.' });
    }

    const newScheduleId = new mongoose.Types.ObjectId();
    const cleanRouteId = mongoose.Types.ObjectId.isValid(routeId) ? routeId : null;
    const cleanBusId = mongoose.Types.ObjectId.isValid(busId) ? busId : null;

    if (mongoose.connection.readyState === 1 && cleanRouteId && cleanBusId) {
      try {
        await Schedule.create({
          _id: newScheduleId,
          title,
          routeId: cleanRouteId,
          busId: cleanBusId,
          departureTime,
          estimatedArrivalTime,
          shift: shift || 'morning',
          daysOfWeek: daysOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isExamSchedule: !!isExamSchedule,
          isActive: true,
        });
      } catch (dbErr) {
        console.warn('[Admin] Schedule creation MongoDB notice:', dbErr.message);
      }
    }

    const newSchedule = {
      _id: newScheduleId.toString(),
      title,
      routeId,
      busId,
      departureTime,
      estimatedArrivalTime,
      shift: shift || 'morning',
      daysOfWeek: daysOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      isExamSchedule: !!isExamSchedule,
      isActive: true,
      createdAt: new Date(),
    };

    store.schedules.push(newSchedule);
    res.status(201).json({ success: true, message: 'Schedule created successfully.', data: newSchedule });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = store.schedules.find((s) => String(s._id) === String(id));

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found.' });
    }

    const { title, routeId, busId, departureTime, estimatedArrivalTime, shift, daysOfWeek, isExamSchedule, isActive } = req.body;

    if (title) schedule.title = title;
    if (routeId) schedule.routeId = routeId;
    if (busId) schedule.busId = busId;
    if (departureTime) schedule.departureTime = departureTime;
    if (estimatedArrivalTime) schedule.estimatedArrivalTime = estimatedArrivalTime;
    if (shift) schedule.shift = shift;
    if (daysOfWeek) schedule.daysOfWeek = daysOfWeek;
    if (isExamSchedule !== undefined) schedule.isExamSchedule = isExamSchedule;
    if (isActive !== undefined) schedule.isActive = isActive;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Schedule.findByIdAndUpdate(id, {
          title: schedule.title,
          routeId: mongoose.Types.ObjectId.isValid(schedule.routeId) ? schedule.routeId : undefined,
          busId: mongoose.Types.ObjectId.isValid(schedule.busId) ? schedule.busId : undefined,
          departureTime: schedule.departureTime,
          estimatedArrivalTime: schedule.estimatedArrivalTime,
          shift: schedule.shift,
          daysOfWeek: schedule.daysOfWeek,
          isExamSchedule: schedule.isExamSchedule,
          isActive: schedule.isActive,
        });
      } catch (dbErr) {
        console.warn('[Admin] Schedule update MongoDB notice:', dbErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Schedule updated successfully.', data: schedule });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const index = store.schedules.findIndex((s) => String(s._id) === String(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Schedule not found.' });
    }

    const deleted = store.schedules.splice(index, 1)[0];

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        await Schedule.findByIdAndDelete(id);
      } catch (dbErr) {
        console.warn('[Admin] Schedule delete MongoDB notice:', dbErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Schedule deleted successfully.', data: deleted });
  } catch (error) {
    next(error);
  }
};

// ==================== EXAM MODE ====================

const toggleExamMode = async (req, res, next) => {
  try {
    const { enabled, customMessage } = req.body;
    const currentState = store.systemSettings.examModeEnabled;
    const targetState = enabled !== undefined ? !!enabled : !currentState;

    store.systemSettings.examModeEnabled = targetState;
    if (customMessage) {
      store.systemSettings.examModeMessage = customMessage;
    }

    // Activate or deactivate exam routes and schedules
    store.routes.forEach((r) => {
      if (r.isExamRoute) {
        r.isActive = targetState;
      }
    });

    store.schedules.forEach((s) => {
      if (s.isExamSchedule) {
        s.isActive = targetState;
      }
    });

    // Broadcast announcement
    notificationService.createNotification({
      title: targetState ? 'Exam Mode ACTIVATED' : 'Exam Mode DEACTIVATED',
      message: targetState
        ? store.systemSettings.examModeMessage || 'Special examination schedules and express non-stop routes are now active.'
        : 'Regular campus transportation schedules and routes have been restored.',
      type: targetState ? 'exam' : 'info',
      targetAudience: 'all',
      createdBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: `Exam Mode ${targetState ? 'activated' : 'deactivated'}. Special exam schedules updated.`,
      data: {
        examModeEnabled: targetState,
        systemSettings: store.systemSettings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SEND NOTIFICATIONS ====================

const sendBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type = 'info', targetAudience = 'all', targetBusId, targetRouteId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Notification title and message are required.' });
    }

    const notif = notificationService.createNotification({
      title,
      message,
      type,
      targetAudience,
      targetBusId,
      targetRouteId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent and broadcasted in real time.',
      data: notif,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== MONITOR TRIPS & EMERGENCIES ====================

const getTripsMonitoring = async (req, res, next) => {
  try {
    const trips = store.trips.map((t) => {
      const bus = store.buses.find((b) => String(b._id) === String(t.busId));
      const route = store.routes.find((r) => String(r._id) === String(t.routeId));
      const driver = store.users.find((u) => String(u._id) === String(t.driverId));
      const loc = store.busLocations.find((l) => String(l.busId) === String(t.busId));

      return {
        ...t,
        busNumber: bus ? bus.busNumber : 'Unknown',
        routeName: route ? route.name : 'Unknown',
        driverName: driver ? driver.name : 'Unknown',
        driverPhone: driver ? driver.phone : '',
        location: loc || null,
      };
    });

    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

// Operator override for driver trip updates
const adminUpdateTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { status, delayMinutes, delayReason } = req.body;

    const trip = store.trips.find((t) => String(t._id) === String(tripId));
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (status) trip.status = status;
    if (delayMinutes !== undefined) trip.delayMinutes = Number(delayMinutes);
    if (delayReason !== undefined) trip.delayReason = delayReason;

    const bus = store.buses.find((b) => String(b._id) === String(trip.busId));

    if (status === 'completed') {
      trip.endTime = new Date();
      if (bus) {
        bus.status = 'active';
        bus.currentTrip = null;
      }
    }

    res.status(200).json({ success: true, message: 'Trip status updated by administrator.', data: trip });
  } catch (error) {
    next(error);
  }
};

const resolveEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, status = 'resolved' } = req.body;

    const emergency = store.emergencyReports.find((e) => String(e._id) === String(id));
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency report not found.' });
    }

    emergency.status = status;
    emergency.resolutionNotes = resolutionNotes || 'Resolved by Campus Transport Operations.';
    emergency.resolvedAt = status === 'resolved' ? new Date() : null;

    // Restore bus status if resolved
    const bus = store.buses.find((b) => String(b._id) === String(emergency.busId));
    if (bus && status === 'resolved' && bus.status === 'maintenance') {
      bus.status = 'active';
    }

    res.status(200).json({
      success: true,
      message: `Emergency marked as ${status}.`,
      data: emergency,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminOverview,
  getBuses,
  createBus,
  updateBus,
  deleteBus,
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleExamMode,
  sendBroadcastNotification,
  getTripsMonitoring,
  adminUpdateTrip,
  resolveEmergency,
};

