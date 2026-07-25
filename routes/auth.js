const express = require('express');
const router = express.Router();
const { login, getMe, register } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);   // testing only
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;