const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, cancelBooking, getAllBookings, getBookingStats } = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');




// Only logged-in users can book
router.post('/', protect, createBooking);

//Get my bookings
router.get('/my', protect, getMyBookings);

//Cancel ticket
router.delete('/:id', protect, cancelBooking);

// ADMIN
router.get('/all', protect, admin, getAllBookings);
router.get('/stats', protect, admin, getBookingStats);

module.exports = router;