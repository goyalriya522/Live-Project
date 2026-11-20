const bcrypt = require('bcryptjs');

// BFGI Main Campus Coordinates: Muktsar Road, Deon, Bathinda, Punjab 151001, India
const BFGI_CAMPUS_COORDS = { lat: 30.2520, lng: 74.8860 };

const store = {
  users: [],
  buses: [],
  routes: [],
  stops: [],
  schedules: [],
  trips: [],
  busLocations: [],
  notifications: [],
  emergencyReports: [],
  examSchedules: [],
  systemSettings: {
    examModeEnabled: false,
    activeExamScheduleId: null,
    examModeMessage: 'Special examination transportation schedules and express routes are operational for college exams.',
    emergencyAlertActive: false,
    activeEmergencyMessage: '',
    announcement: 'Welcome to CampusBus — Smart College Bus Tracking & Transit Management Portal.',
  },
};

// Seed clean fallback data for CampusBus
const initMemoryStore = async () => {
  // Only populate fallback data if not already loaded from MongoDB
  if (store.users && store.users.length > 0) {
    return;
  }

  const hashedPasswordAdmin = await bcrypt.hash('Admin@123', 10);
  const hashedPasswordDriver = await bcrypt.hash('Driver@123', 10);
  const hashedPasswordStudent = await bcrypt.hash('Student@123', 10);

  if (!store.users || store.users.length === 0) {
    store.users = [
      {
        _id: 'user_admin_01',
        name: 'CampusBus Transport Controller',
        email: 'admin@campusbus.edu',
        password: hashedPasswordAdmin,
        role: 'admin',
        phone: '+91 164-2786001',
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        createdAt: new Date(),
      },
      {
        _id: 'user_driver_01',
        name: 'Gurpreet Singh',
        email: 'driver1@campusbus.edu',
        password: hashedPasswordDriver,
        role: 'driver',
        phone: '+91 98765-10001',
        licenseNumber: 'PB-03-2018-00124',
        assignedBus: null,
        assignedRoute: null,
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        createdAt: new Date(),
      },
      {
        _id: 'user_driver_02',
        name: 'Harpreet Singh',
        email: 'driver2@campusbus.edu',
        password: hashedPasswordDriver,
        role: 'driver',
        phone: '+91 98765-10002',
        licenseNumber: 'PB-03-2019-00256',
        assignedBus: null,
        assignedRoute: null,
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        createdAt: new Date(),
      },
      {
        _id: 'user_student_01',
        name: 'Amanpreet Kaur',
        email: 'student1@campusbus.edu',
        password: hashedPasswordStudent,
        role: 'student',
        phone: '+91 98765-20001',
        studentId: 'BFGI-2024-STU01',
        assignedBus: null,
        assignedRoute: null,
        selectedStop: null,
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        createdAt: new Date(),
      },
      {
        _id: 'user_student_02',
        name: 'Navjot Singh',
        email: 'student2@campusbus.edu',
        password: hashedPasswordStudent,
        role: 'student',
        phone: '+91 98765-20002',
        studentId: 'BFGI-2024-STU02',
        assignedBus: null,
        assignedRoute: null,
        selectedStop: null,
        isActive: true,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        createdAt: new Date(),
      },
    ];
  }

  // Official CampusBus Transportation Announcements
  store.notifications = [
    {
      _id: 'notif_campusbus_01',
      title: 'CampusBus Transport Management Operational',
      message: 'Official transit portal for CampusBus. Configure Route 1 to Route 95 to begin real-time vehicle monitoring.',
      type: 'info',
      targetAudience: 'all',
      isRead: false,
      createdAt: new Date(),
    },
    {
      _id: 'notif_bfgi_02',
      title: 'Punctuality & Safety Advisory',
      message: 'All students are advised to reach their designated boarding stop 5 minutes prior to the scheduled morning pickup time.',
      type: 'info',
      targetAudience: 'students',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
  ];
};

// Immediately initialize in-memory store so users and institutional records are ready on load
initMemoryStore();

module.exports = {
  store,
  initMemoryStore,
  BFGI_CAMPUS_COORDS,
};
