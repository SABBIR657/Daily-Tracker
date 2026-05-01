const express = require('express');
const router = express.Router();
const { register, login, getMe, updateGoals } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);      // NO protect here
router.post('/login',    login);         // NO protect here
router.get('/me',        protect, getMe);
router.put('/goals',     protect, updateGoals);

module.exports = router;