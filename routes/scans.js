const express = require('express');
const router  = express.Router();
const {
  createScan, getScan, getAnalytics, uploadImage
} = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

// ── PUBLIC ROUTES (no token needed) ───────────────────────
router.post('/',             createScan);
router.post('/upload-image', uploadImage);

// ── PUBLIC GET (no token needed) ───────────────────────────
router.get('/:id', getScan);

// ── PROTECTED ROUTES (admin only) ──────────────────────────
router.get('/analytics/summary', protect, getAnalytics);

module.exports = router;