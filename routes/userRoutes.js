const {
  registerUser,
  loginUser,
  getUserProfile,
  resetPassword,
  updateUserProfile
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile);

router.put('/reset-password', resetPassword);