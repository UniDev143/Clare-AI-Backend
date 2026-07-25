const express = require('express');
const router  = express.Router();
const {
  createScan, getScan, getAnalytics,
  uploadImage, updateQuestionnaire
} = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

router.post('/',             createScan);
router.post('/upload-image', uploadImage);
router.get('/analytics/summary', protect, getAnalytics);
router.get('/:id',           getScan);
router.patch('/:id/questionnaire', updateQuestionnaire);

module.exports = router;