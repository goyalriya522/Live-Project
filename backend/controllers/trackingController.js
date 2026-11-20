const { store } = require('../utils/memoryStore');
const { gpsSimulator } = require('../services/gpsSimulationService');

// @desc    Get latest location of a specific bus
// @route   GET /api/tracking/bus/:busId
// @access  Public / Authenticated
const getBusLocation = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const bus = store.buses.find((b) => String(b._id) === String(busId));

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found.' });
    }

    const location = store.busLocations.find((l) => String(l.busId) === String(bus._id));
    const trip = store.trips.find((t) => String(t._id) === String(bus.currentTrip));
    const route = store.routes.find((r) => String(r._id) === String(bus.assignedRoute));

    res.status(200).json({
      success: true,
      data: {
        bus: {
          _id: bus._id,
          busNumber: bus.busNumber,
          registrationNumber: bus.registrationNumber,
          status: bus.status,
        },
        route: route
          ? {
              _id: route._id,
              name: route.name,
              routeCode: route.routeCode,
              stops: route.stops,
              pathCoordinates: route.pathCoordinates,
            }
          : null,
        trip: trip
          ? {
              _id: trip._id,
              status: trip.status,
              delayMinutes: trip.delayMinutes,
              startTime: trip.startTime,
            }
          : null,
        location: location || {
          latitude: 28.5800,
          longitude: 77.3100,
          speedKmH: 0,
          heading: 0,
          isLive: false,
          isSimulated: true,
          lastUpdated: new Date(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active bus locations (for live fleet map)
// @route   GET /api/tracking/all
// @access  Public / Authenticated
const getAllBusLocations = async (req, res, next) => {
  try {
    const locations = store.buses.map((bus) => {
      const loc = store.busLocations.find((l) => String(l.busId) === String(bus._id));
      const trip = store.trips.find((t) => String(t._id) === String(bus.currentTrip));
      const route = store.routes.find((r) => String(r._id) === String(bus.assignedRoute));

      return {
        busId: bus._id,
        busNumber: bus.busNumber,
        registrationNumber: bus.registrationNumber,
        status: bus.status,
        routeName: route ? route.name : 'Unassigned',
        routeCode: route ? route.routeCode : '',
        tripStatus: trip ? trip.status : 'not_started',
        delayMinutes: trip ? trip.delayMinutes : 0,
        latitude: loc ? loc.latitude : 28.5800,
        longitude: loc ? loc.longitude : 77.3100,
        speedKmH: loc ? loc.speedKmH : 0,
        heading: loc ? loc.heading : 0,
        nextStopName: loc ? loc.nextStopName : '',
        etaNextStopMinutes: loc ? loc.etaNextStopMinutes : 0,
        isLive: loc ? loc.isLive : false,
        isSimulated: loc ? loc.isSimulated : true,
        lastUpdated: loc ? loc.lastUpdated : bus.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ingest GPS location update (from hardware GPS device, phone tracker, or simulator)
// @route   POST /api/tracking/update
// @access  Private (Driver or Admin or API Key)
const updateLocation = async (req, res, next) => {
  try {
    const { busId, latitude, longitude, speedKmH, heading } = req.body;

    if (!busId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'busId, latitude, and longitude are required.',
      });
    }

    const updated = gpsSimulator.updateBusPosition(busId, latitude, longitude, speedKmH, heading);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusLocation,
  getAllBusLocations,
  updateLocation,
};

