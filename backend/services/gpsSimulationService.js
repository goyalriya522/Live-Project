const { store } = require('../utils/memoryStore');
const mongoose = require('mongoose');

// Haversine formula to calculate approximate distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate bearing in degrees between two coordinates
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

class GPSSimulationEngine {
  constructor() {
    this.io = null;
    this.intervalId = null;
    // Map of busId -> { stepIndex: number, forward: boolean, speedKmH: number }
    this.simulationStates = new Map();
    this.isRunning = false;
  }

  init(io) {
    this.io = io;
    this.startSimulationLoop();
    console.log('[GPS Simulation] Engine initialized with real-time route pathing.');
  }

  startSimulationLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.advanceSimulatedBuses();
    }, 4000); // Pulse update every 4 seconds
  }

  stopSimulationLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  advanceSimulatedBuses() {
    // Only simulate buses that have an active or started trip
    const activeTrips = store.trips.filter(
      (t) => t.status === 'started' || t.status === 'on_route' || t.status === 'approaching_stop'
    );

    activeTrips.forEach((trip) => {
      const bus = store.buses.find((b) => String(b._id) === String(trip.busId));
      if (!bus) return;

      let route = store.routes.find((r) => String(r._id) === String(bus.assignedRoute || trip.routeId));
      if (!route) {
        route = store.routes.find((r) => String(r.assignedBus) === String(bus._id));
      }
      if (!route) return;

      // Resolve valid path coordinates from pathCoordinates or route.stops
      let path = route.pathCoordinates;
      if (!path || path.length < 2) {
        if (route.stops && route.stops.length >= 2) {
          path = route.stops.map((s) => ({ lat: s.lat || 30.2520, lng: s.lng || 74.8860 }));
        } else if (route.stops && route.stops.length === 1) {
          path = [
            { lat: route.stops[0].lat || 30.2520, lng: route.stops[0].lng || 74.8860 },
            { lat: 30.2520, lng: 74.8860 },
          ];
        } else {
          path = [
            { lat: 30.2110, lng: 74.9455 },
            { lat: 30.2520, lng: 74.8860 },
          ];
        }
      }

      const busIdStr = String(bus._id);
      let state = this.simulationStates.get(busIdStr);

      if (!state) {
        state = {
          coordIndex: 0,
          forward: true,
          speedKmH: 35 + Math.floor(Math.random() * 8),
        };
        this.simulationStates.set(busIdStr, state);
      }

      // Advance along path coordinates
      if (state.forward) {
        state.coordIndex += 1;
        if (state.coordIndex >= path.length - 1) {
          state.coordIndex = path.length - 1;
          state.forward = false; // Turn around or reach campus terminus
        }
      } else {
        state.coordIndex -= 1;
        if (state.coordIndex <= 0) {
          state.coordIndex = 0;
          state.forward = true;
        }
      }

      const currentCoord = path[state.coordIndex];
      const nextIndex = state.forward
        ? Math.min(state.coordIndex + 1, path.length - 1)
        : Math.max(state.coordIndex - 1, 0);
      const nextCoord = path[nextIndex];

      const heading = calculateBearing(
        currentCoord.lat,
        currentCoord.lng,
        nextCoord.lat,
        nextCoord.lng
      );

      // Determine next upcoming stop from stops array
      let nextStopName = 'Approaching Stop';
      let nextStopOrder = 1;
      let etaNextStopMinutes = 3;

      if (route.stops && route.stops.length > 0) {
        // Find closest stop that is ahead
        const progressRatio = state.coordIndex / Math.max(1, path.length - 1);
        const targetStopIndex = Math.min(
          Math.floor(progressRatio * route.stops.length),
          route.stops.length - 1
        );
        const stop = route.stops[targetStopIndex];
        if (stop) {
          nextStopName = stop.name;
          nextStopOrder = stop.order;
          const distToStop = calculateDistanceKm(currentCoord.lat, currentCoord.lng, stop.lat, stop.lng);
          etaNextStopMinutes = Math.max(1, Math.round((distToStop / (state.speedKmH || 30)) * 60));
        }
      }

      // Update bus location in store
      let locRecord = store.busLocations.find((l) => String(l.busId) === busIdStr);
      const updatedData = {
        busId: bus._id,
        tripId: trip._id,
        latitude: currentCoord.lat,
        longitude: currentCoord.lng,
        speedKmH: state.speedKmH + (Math.random() > 0.5 ? 2 : -2),
        heading: Math.round(heading),
        nextStopName,
        nextStopOrder,
        etaNextStopMinutes,
        currentStopIndex: Math.floor((state.coordIndex / (path.length - 1)) * (route.stops.length || 1)),
        pathProgressPercent: Math.round((state.coordIndex / (path.length - 1)) * 100),
        isLive: true,
        isSimulated: true,
        lastUpdated: new Date(),
      };

      if (locRecord) {
        Object.assign(locRecord, updatedData);
      } else {
        locRecord = { _id: `loc_${busIdStr}`, ...updatedData };
        store.busLocations.push(locRecord);
      }

      // Broadcast to Socket.io rooms:
      if (this.io) {
        const payload = {
          busId: bus._id,
          busNumber: bus.busNumber,
          routeId: route._id,
          routeName: route.name,
          tripId: trip._id,
          tripStatus: trip.status,
          location: updatedData,
        };

        // Broadcast to bus-specific room, admin room, and global
        this.io.to(`bus:${busIdStr}`).emit('bus:location_update', payload);
        this.io.to('admin_room').emit('bus:location_update', payload);
        this.io.emit('location:pulse', payload);
      }
    });
  }

  // Allow manual GPS coordinate update (e.g. from driver or external IoT hardware)
  updateBusPosition(busId, latitude, longitude, speedKmH = 30, heading = 0) {
    const busIdStr = String(busId);
    let locRecord = store.busLocations.find((l) => String(l.busId) === busIdStr);
    const bus = store.buses.find((b) => String(b._id) === busIdStr);

    const updatedData = {
      busId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      speedKmH: Number(speedKmH),
      heading: Number(heading),
      isLive: true,
      isSimulated: false,
      lastUpdated: new Date(),
    };

    if (locRecord) {
      Object.assign(locRecord, updatedData);
    } else {
      locRecord = { _id: `loc_${busIdStr}`, ...updatedData };
      store.busLocations.push(locRecord);
    }

    if (this.io && bus) {
      const payload = {
        busId,
        busNumber: bus.busNumber,
        location: locRecord,
      };
      this.io.to(`bus:${busIdStr}`).emit('bus:location_update', payload);
      this.io.to('admin_room').emit('bus:location_update', payload);
    }

    return locRecord;
  }
}

const gpsSimulator = new GPSSimulationEngine();

module.exports = { gpsSimulator, calculateDistanceKm, calculateBearing };

