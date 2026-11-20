const express = require('express');
const router = express.Router();
const {
  getAvailableBuses,
  selectBus,
  getStudentDashboard,
  getStudentNotifications,
  markNotificationRead,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('student', 'admin'));

router.get('/buses', getAvailableBuses);
router.post('/select-bus', selectBus);
router.get('/dashboard', getStudentDashboard);
router.get('/notifications', getStudentNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;

