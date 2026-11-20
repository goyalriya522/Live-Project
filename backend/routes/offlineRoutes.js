const express = require('express');
const router = express.Router();
const { getOfflineSnapshot, syncOfflineData } = require('../controllers/offlineController');
const { protect } = require('../middleware/authMiddleware');

// Public or student can fetch snapshot
router.get('/snapshot', getOfflineSnapshot);
// Protected sync for queued actions
router.post('/sync', protect, syncOfflineData);

module.exports = router;

