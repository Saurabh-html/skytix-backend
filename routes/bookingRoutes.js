const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Only logged-in users can book
router.post('/', protect, createBooking);

//Get my bookings
router.get('/my', protect, getMyBookings);

//Cancel ticket
router.delete('/:id', protect, cancelBooking);

module.exports = router;