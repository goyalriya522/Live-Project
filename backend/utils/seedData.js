const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const Schedule = require('../models/Schedule');
const Trip = require('../models/Trip');
const BusLocation = require('../models/BusLocation');
const Notification = require('../models/Notification');
const EmergencyReport = require('../models/EmergencyReport');
const ExamSchedule = require('../models/ExamSchedule');
const SystemSettings = require('../models/SystemSettings');

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbus';

    await mongoose.connect(uri);
    console.log('[Seed] Connected to MongoDB for Baba Farid Group of Institutions (BFGI).');

    // Clear existing mock data
    await User.deleteMany();
    await Bus.deleteMany();
    await Route.deleteMany();
    await Stop.deleteMany();
    await Schedule.deleteMany();
    await Trip.deleteMany();
    await BusLocation.deleteMany();
    await Notification.deleteMany();
    await EmergencyReport.deleteMany();
    await ExamSchedule.deleteMany();
    await SystemSettings.deleteMany();

    console.log('[Seed] Cleared mock records.');

    // Passwords
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const driverPass = await bcrypt.hash('Driver@123', 10);
    const studentPass = await bcrypt.hash('Student@123', 10);

    // Seed Real Institutional Users for BFGI Bathinda
    const adminUser = await User.create({
      name: 'BFGI Transport Controller',
      email: 'admin@campusbus.edu',
      password: adminPass,
      role: 'admin',
      phone: '+91 164-2786001',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const driver1 = await User.create({
      name: 'Gurpreet Singh',
      email: 'driver1@campusbus.edu',
      password: driverPass,
      role: 'driver',
      phone: '+91 98765-10001',
      licenseNumber: 'PB-03-2018-00124',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const driver2 = await User.create({
      name: 'Harpreet Singh',
      email: 'driver2@campusbus.edu',
      password: driverPass,
      role: 'driver',
      phone: '+91 98765-10002',
      licenseNumber: 'PB-03-2019-00256',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    const student1 = await User.create({
      name: 'Amanpreet Kaur',
      email: 'student1@campusbus.edu',
      password: studentPass,
      role: 'student',
      phone: '+91 98765-20001',
      studentId: 'BFGI-2024-STU01',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });

    const student2 = await User.create({
      name: 'Navjot Singh',
      email: 'student2@campusbus.edu',
      password: studentPass,
      role: 'student',
      phone: '+91 98765-20002',
      studentId: 'BFGI-2024-STU02',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    });

    // BFGI System Settings
    await SystemSettings.create({
      examModeEnabled: false,
      examModeMessage: 'Special examination transportation schedules and express routes are active for BFGI exams.',
      emergencyAlertActive: false,
      announcement: 'Welcome to Baba Farid Group of Institutions (BFGI), Bathinda — Smart College Bus Tracking & Transit Management Portal.',
    });

    // BFGI Notifications
    await Notification.create([
      {
        title: 'BFGI Smart Transit System Operational',
        message: 'Official transit portal for Baba Farid Group of Institutions, Bathinda. Students can track assigned bus routes and timings here.',
        type: 'info',
        targetAudience: 'all',
        isRead: false,
      },
      {
        title: 'Morning Shift Punctuality Advisory',
        message: 'All students are requested to reach their designated stops 5 minutes prior to the scheduled pickup time.',
        type: 'info',
        targetAudience: 'students',
        isRead: false,
      },
    ]);

    console.log('[Seed] Database successfully seeded with clean institutional BFGI records.');
    console.log('--- Demo Logins ---');
    console.log('Admin: admin@campusbus.edu / Admin@123');
    console.log('Driver: driver1@campusbus.edu / Driver@123');
    console.log('Student: student1@campusbus.edu / Student@123');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();
