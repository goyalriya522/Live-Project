import api from './api';

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem('campusbus_token', res.data.token);
      localStorage.setItem('campusbus_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.token) {
      localStorage.setItem('campusbus_token', res.data.token);
      localStorage.setItem('campusbus_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    if (res.data) {
      localStorage.setItem('campusbus_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data) {
      localStorage.setItem('campusbus_user', JSON.stringify(res.data));
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('campusbus_token');
    localStorage.removeItem('campusbus_user');
  },

  getStoredUser: () => {
    try {
      const u = localStorage.getItem('campusbus_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  getStoredToken: () => {
    return localStorage.getItem('campusbus_token');
  },
};

