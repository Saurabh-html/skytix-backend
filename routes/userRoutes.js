const express = require('express');
const router = express.Router(); 

const {
  registerUser,
  loginUser,
  getUserProfile,
  resetPassword,
  updateUserProfile
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// REGISTER
router.post('/register', registerUser);

// LOGIN
router.post('/login', loginUser);

// GET PROFILE
router.get('/profile', protect, getUserProfile);

// UPDATE PROFILE (NEW)
router.put('/profile', protect, updateUserProfile);

// RESET PASSWORD
router.put('/reset-password', resetPassword);

module.exports = router;