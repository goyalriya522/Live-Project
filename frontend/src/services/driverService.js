import api from './api';

export const driverService = {
  getDashboard: async () => {
    const res = await api.get('/driver/dashboard');
    return res.data;
  },

  startTrip: async (payload = {}) => {
    const res = await api.post('/driver/start-trip', payload);
    return res.data;
  },

  updateTripStatus: async (statusData) => {
    const res = await api.put('/driver/trip-status', statusData);
    return res.data;
  },

  reportEmergency: async (emergencyData) => {
    const res = await api.post('/driver/emergency', emergencyData);
    return res.data;
  },
};

