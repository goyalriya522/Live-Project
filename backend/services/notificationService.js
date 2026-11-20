const { store } = require('../utils/memoryStore');

class NotificationService {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;
  }

  createNotification({
    title,
    message,
    type = 'info',
    targetAudience = 'all',
    targetBusId = null,
    targetRouteId = null,
    createdBy = null,
  }) {
    const notification = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type, // 'info', 'warning', 'delay', 'emergency', 'exam', 'success'
      targetAudience, // 'all', 'bus', 'route', 'drivers', 'students'
      targetBusId: targetBusId ? String(targetBusId) : null,
      targetRouteId: targetRouteId ? String(targetRouteId) : null,
      createdBy: createdBy ? String(createdBy) : null,
      readBy: [],
      createdAt: new Date(),
    };

    store.notifications.unshift(notification);

    // Keep memory store trimmed to last 200 notifications
    if (store.notifications.length > 200) {
      store.notifications = store.notifications.slice(0, 200);
    }

    // Real-time broadcast
    if (this.io) {
      if (targetAudience === 'all') {
        this.io.emit('notification:new', notification);
      } else if (targetAudience === 'bus' && targetBusId) {
        this.io.to(`bus:${targetBusId}`).emit('notification:new', notification);
        this.io.to('admin_room').emit('notification:new', notification);
      } else if (targetAudience === 'route' && targetRouteId) {
        this.io.to(`route:${targetRouteId}`).emit('notification:new', notification);
        this.io.to('admin_room').emit('notification:new', notification);
      } else if (targetAudience === 'drivers') {
        this.io.to('driver_room').emit('notification:new', notification);
        this.io.to('admin_room').emit('notification:new', notification);
      } else {
        this.io.emit('notification:new', notification);
      }
    }

    return notification;
  }

  getNotificationsForUser(user) {
    if (!user) return store.notifications;

    if (user.role === 'admin') {
      return store.notifications;
    }

    if (user.role === 'driver') {
      return store.notifications.filter(
        (n) =>
          n.targetAudience === 'all' ||
          n.targetAudience === 'drivers' ||
          (user.assignedBus && n.targetBusId === String(user.assignedBus)) ||
          (user.assignedRoute && n.targetRouteId === String(user.assignedRoute))
      );
    }

    // Student
    return store.notifications.filter(
      (n) =>
        n.targetAudience === 'all' ||
        n.targetAudience === 'students' ||
        (user.assignedBus && n.targetBusId === String(user.assignedBus)) ||
        (user.assignedRoute && n.targetRouteId === String(user.assignedRoute))
    );
  }
}

const notificationService = new NotificationService();

module.exports = { notificationService };

