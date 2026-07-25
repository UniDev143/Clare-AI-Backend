const express = require('express');
const router = express.Router();
const { createScan, getScan, getAnalytics } = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

// Public — end user scans (no login)
router.post('/', createScan);
router.get('/:id', getScan);

// Protected — admin analytics only
router.get('/analytics/summary', protect, getAnalytics);

module.exports = router;