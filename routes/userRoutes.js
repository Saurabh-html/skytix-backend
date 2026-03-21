const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, resetPassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');


// Register route
router.post('/register', registerUser);

//Login
router.post('/login', loginUser);

//Get User Profile
router.get('/profile', protect, getUserProfile);

//Reset Password
router.put('/reset-password', resetPassword);

module.exports = router;