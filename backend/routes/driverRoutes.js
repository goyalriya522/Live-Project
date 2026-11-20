const express = require('express');
const router = express.Router();
const {
  getDriverDashboard,
  startTrip,
  updateTripStatus,
  reportEmergency,
} = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('driver', 'admin'));

router.get('/dashboard', getDriverDashboard);
router.post('/start-trip', startTrip);
router.put('/trip-status', updateTripStatus);
router.post('/emergency', reportEmergency);

module.exports = router;

