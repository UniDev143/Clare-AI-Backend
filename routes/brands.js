const express = require('express');
const router = express.Router();
const { getMyBrand, updateMyBrand } = require('../controllers/brandController');
const { protect } = require('../middleware/auth');

router.get('/my', protect, getMyBrand);
router.put('/my', protect, updateMyBrand);

module.exports = router;