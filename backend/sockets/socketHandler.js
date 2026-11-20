const jwt = require('jsonwebtoken');
const { store } = require('../utils/memoryStore');

const initSocketIO = (io) => {
  io.use((socket, next) => {
    // Optional socket token authentication
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campusbus_jwt_secret_dev_key_2026');
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
      } catch (err) {
        // Allow connection even without token, but mark unauthenticated
        socket.userId = null;
        socket.userRole = 'guest';
      }
    } else {
      socket.userRole = 'guest';
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (Role: ${socket.userRole || 'guest'})`);

    // Join role-specific rooms
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
      console.log(`[Socket.io] Admin joined admin_room: ${socket.id}`);
    } else if (socket.userRole === 'driver') {
      socket.join('driver_room');
    } else if (socket.userRole === 'student') {
      socket.join('student_room');
    }

    // Client subscribes to a specific bus channel
    socket.on('join:bus', (busId) => {
      if (busId) {
        const roomName = `bus:${busId}`;
        socket.join(roomName);
        console.log(`[Socket.io] Client ${socket.id} joined room ${roomName}`);

        // Send immediately the latest known location for this bus
        const loc = store.busLocations.find((l) => String(l.busId) === String(busId));
        if (loc) {
          const bus = store.buses.find((b) => String(b._id) === String(busId));
          socket.emit('bus:location_update', {
            busId,
            busNumber: bus?.busNumber || 'BUS',
            location: loc,
          });
        }
      }
    });

    socket.on('leave:bus', (busId) => {
      if (busId) {
        socket.leave(`bus:${busId}`);
      }
    });

    // Client requests immediate bus pulse
    socket.on('request:bus_location', (busId) => {
      const loc = store.busLocations.find((l) => String(l.busId) === String(busId));
      if (loc) {
        const bus = store.buses.find((b) => String(b._id) === String(busId));
        socket.emit('bus:location_update', {
          busId,
          busNumber: bus?.busNumber || 'BUS',
          location: loc,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });
};

module.exports = { initSocketIO };

