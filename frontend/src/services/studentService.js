import api from './api';

export const studentService = {
  getBuses: async () => {
    const res = await api.get('/student/buses');
    return res.data;
  },

  selectBus: async (busId, selectedStop) => {
    const res = await api.post('/student/select-bus', { busId, selectedStop });
    return res.data;
  },

  getDashboard: async () => {
    const res = await api.get('/student/dashboard');
    return res.data;
  },

  getNotifications: async () => {
    const res = await api.get('/student/notifications');
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await api.put(`/student/notifications/${id}/read`, {});
    return res.data;
  },
};

