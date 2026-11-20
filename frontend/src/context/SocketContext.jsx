import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveLocationUpdate, setLiveLocationUpdate] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);
  const [latestEmergency, setLatestEmergency] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const socket = io(socketUrl, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to CampusBus real-time server with id:', socket.id);
      setIsConnected(true);

      // If user has assigned bus, join its room automatically
      if (user?.assignedBus?._id || user?.assignedBus) {
        const busId = user.assignedBus._id || user.assignedBus;
        socket.emit('join:bus', busId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    // Real-time bus location pulse from server simulation engine
    socket.on('bus:location_update', (data) => {
      setLiveLocationUpdate(data);
    });

    socket.on('location:pulse', (data) => {
      setLiveLocationUpdate(data);
    });

    // Real-time Notifications
    socket.on('notification:new', (notif) => {
      setLatestNotification(notif);
    });

    // Real-time Emergency Alerts
    socket.on('emergency:alert', (alert) => {
      setLatestEmergency(alert);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, user?.assignedBus]);

  const joinBus = (busId) => {
    if (socketRef.current && busId) {
      socketRef.current.emit('join:bus', busId);
    }
  };

  const leaveBus = (busId) => {
    if (socketRef.current && busId) {
      socketRef.current.emit('leave:bus', busId);
    }
  };

  const requestBusLocation = (busId) => {
    if (socketRef.current && busId) {
      socketRef.current.emit('request:bus_location', busId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        liveLocationUpdate,
        latestNotification,
        latestEmergency,
        joinBus,
        leaveBus,
        requestBusLocation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

