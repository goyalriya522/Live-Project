import api from './api';

export const adminService = {
  getOverview: async () => {
    const res = await api.get('/admin/overview');
    return res.data;
  },

  // Buses
  getBuses: async () => {
    const res = await api.get('/admin/buses');
    return res.data;
  },
  createBus: async (busData) => {
    const res = await api.post('/admin/buses', busData);
    return res.data;
  },
  updateBus: async (id, busData) => {
    const res = await api.put(`/admin/buses/${id}`, busData);
    return res.data;
  },
  deleteBus: async (id) => {
    const res = await api.delete(`/admin/buses/${id}`);
    return res.data;
  },

  // Drivers
  getDrivers: async () => {
    const res = await api.get('/admin/drivers');
    return res.data;
  },
  createDriver: async (driverData) => {
    const res = await api.post('/admin/drivers', driverData);
    return res.data;
  },
  updateDriver: async (id, driverData) => {
    const res = await api.put(`/admin/drivers/${id}`, driverData);
    return res.data;
  },
  deleteDriver: async (id) => {
    const res = await api.delete(`/admin/drivers/${id}`);
    return res.data;
  },

  // Routes
  getRoutes: async () => {
    const res = await api.get('/admin/routes');
    return res.data;
  },
  createRoute: async (routeData) => {
    const res = await api.post('/admin/routes', routeData);
    return res.data;
  },
  updateRoute: async (id, routeData) => {
    const res = await api.put(`/admin/routes/${id}`, routeData);
    return res.data;
  },
  deleteRoute: async (id) => {
    const res = await api.delete(`/admin/routes/${id}`);
    return res.data;
  },

  // Schedules
  getSchedules: async () => {
    const res = await api.get('/admin/schedules');
    return res.data;
  },
  createSchedule: async (scheduleData) => {
    const res = await api.post('/admin/schedules', scheduleData);
    return res.data;
  },
  updateSchedule: async (id, scheduleData) => {
    const res = await api.put(`/admin/schedules/${id}`, scheduleData);
    return res.data;
  },
  deleteSchedule: async (id) => {
    const res = await api.delete(`/admin/schedules/${id}`);
    return res.data;
  },

  // Exam Mode
  toggleExamMode: async (data) => {
    const res = await api.post('/admin/exam-mode', data);
    return res.data;
  },

  // Broadcast Notification
  sendNotification: async (notifData) => {
    const res = await api.post('/admin/notifications', notifData);
    return res.data;
  },

  // Trips Monitoring
  getTrips: async () => {
    const res = await api.get('/admin/trips');
    return res.data;
  },
  updateTripOperator: async (tripId, data) => {
    const res = await api.put(`/admin/trips/${tripId}`, data);
    return res.data;
  },

  // Emergencies
  resolveEmergency: async (id, data) => {
    const res = await api.put(`/admin/emergencies/${id}`, data);
    return res.data;
  },
};

