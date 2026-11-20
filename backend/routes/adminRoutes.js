const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  getBuses,
  createBus,
  updateBus,
  deleteBus,
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleExamMode,
  sendBroadcastNotification,
  getTripsMonitoring,
  adminUpdateTrip,
  resolveEmergency,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

// Overview
router.get('/overview', getAdminOverview);

// Buses
router.get('/buses', getBuses);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);
router.delete('/buses/:id', deleteBus);

// Drivers
router.get('/drivers', getDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Routes
router.get('/routes', getRoutes);
router.post('/routes', createRoute);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);

// Schedules
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.put('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Exam Mode
router.post('/exam-mode', toggleExamMode);

// Notifications
router.post('/notifications', sendBroadcastNotification);

// Trips Monitoring & Operator Overrides
router.get('/trips', getTripsMonitoring);
router.put('/trips/:tripId', adminUpdateTrip);

// Emergencies
router.put('/emergencies/:id', resolveEmergency);

module.exports = router;

