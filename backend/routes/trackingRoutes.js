const express = require('express');
const router = express.Router();
const {
  getBusLocation,
  getAllBusLocations,
  updateLocation,
} = require('../controllers/trackingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/all', getAllBusLocations);
router.get('/bus/:busId', getBusLocation);
router.post('/update', protect, updateLocation);

module.exports = router;

