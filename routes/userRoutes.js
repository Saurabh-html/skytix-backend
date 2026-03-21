const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

//Login
router.post('/login', loginUser);

//Get User Profile
router.get('/profile', protect, getUserProfile);

module.exports = router;